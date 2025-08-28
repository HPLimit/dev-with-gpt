import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import {Background, Controls, Handle, Position, ReactFlow, useEdgesState, useNodesState} from '@xyflow/react';

import SVGSideBarExpand from '../../../../assets/svg/sidebar-expand.svg';
import SVGSideBarCollapse from '../../../../assets/svg/sidebar-collapse.svg';

import {Button} from 'primereact/button';
import {useFetchResources} from "../../../Component/Resources";
import {
    createWorkflowStep,
    deleteWorkflowStep,
    getAutomationStepList,
    getAutomationWorkflow,
    updateWorkflowStep
} from "../../../../service/requestAPI";
import {useConfirmLeave, useRole, useWarnBeforeUnload} from "../../../../hook";
import {useOutletContext, useParams} from "react-router-dom";
import {useSelector} from "react-redux";
import {TabPanel, TabView} from 'primereact/tabview';
import {ConfirmDialog, confirmDialog} from "primereact/confirmdialog";

import WorkflowStepDetail, {intFields as INT_FIELDS_STEP} from "./WorkflowStepDetail";
import {randomString, showToast} from "../../../../util/func";
import {
    COMPARES,
    conditionToLabel,
    DEFAULT_EDGE,
    deserializeNode,
    EDITOR_FIELD_STYLE,
    getDemoNodes,
    OPTIONS_FIELDS,
    serializeNode,
    stepFieldConfig,
    stepType,
    stepTypeLabel,
    TRANSITION_SOURCE,
    workflowInfoDefault
} from "./common";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import classNames from "classnames";
import {ContextMenu} from "primereact/contextmenu";
import {FlowProvider, useFlow} from "./FlowContext";

let ORIGINAL_STEPS = {}
let MAX_STEP_ORDER = 0;
export default function WorkFlowDetailNew() {
    const role = useRole();
    const {workflowId} = useParams();
    const [masterToast] = useOutletContext();
    const partnerId = useSelector(({auth: {userid}}) => userid);
    const [forceReload, setForceReload] = useState(0);
    const [forceReloadWorkFlow, setForceReloadWorkflow] = useState(0);
    const reactFlowInstanceRef = useRef(null);
    const mainContextMN = useRef(null);

    const [canSendUpdateStep, setCanSendUpdateStep] = useState(false);
    const [stepsChanged, setStepsChanged] = useState([]);
    const [newStepsAdded, setNewStepAdded] = useState([]);

    const [workflowInfo, setWorkflowInfo] = useState(workflowInfoDefault());

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const selectedNode = useMemo(() => nodes.find(n => n.id === String(selectedNodeId)) || null, [nodes, selectedNodeId]);

    const [nodeEditor, setNodeEditor] = useState(null);
    const [rightTabViewActiveIndex, setRightTabViewActiveIndex] = useState(0);

    const [flowData, , loadingWorkflow, setLoadingWorkflow] = useFetchResources(useCallback(getAutomationWorkflow.bind(null, {
        partnerId, workflowId
    }), [partnerId, workflowId]), forceReloadWorkFlow);

    const [stepsData, , loading, setLoading] = useFetchResources(useCallback(getAutomationStepList.bind(null, {workflowId}), [workflowId]), forceReload);

    const [showRSidebar, setShowRSidebar] = useState(false);

    useConfirmLeave(canSendUpdateStep, () => window.confirm("Bạn có chắc chắn muốn rời đi? Mọi thay đổi, thêm mới chưa được lưu sẽ bị mất."));
    useWarnBeforeUnload(canSendUpdateStep);

    useEffect(() => {
        if (flowData.data) {
            setWorkflowInfo(flowData.data)
        }
    }, [flowData]);

    useEffect(() => {
        if (stepsData.data) {
            for (const stepData of stepsData.data) {
                ORIGINAL_STEPS[stepData.id] = Object.freeze({
                    data: stepData,
                    hash: JSON.stringify(stepData)
                });

                if (stepData.stepOrder > MAX_STEP_ORDER) {
                    MAX_STEP_ORDER = stepData.stepOrder;
                }
            }
            ORIGINAL_STEPS.all = Object.freeze(stepsData.data);
            setNewStepAdded([]);
            setStepsChanged([]);
            computeStepToNode(ORIGINAL_STEPS.all);
        }
    }, [stepsData]);

    useEffect(() => {
        resetEditorFromNode();
    }, [selectedNodeId]);

    useEffect(() => {
        setCanSendUpdateStep(stepsChanged.length > 0 || newStepsAdded.length > 0);
    }, [stepsChanged.length, newStepsAdded.length]);

    function applyNodeEdits(node) {
        if (!node) return;

        console.log("applyNodeEdits", node);

        const nodeChangeIndex = nodes.findIndex(n => n.id === node.id);
        if (nodeChangeIndex === -1) {
            return;
        }

        const stepChangedId = node.data.id;

        const isDiff = isStepDataChanged(stepChangedId, node.data);

        const newStateStep = deserializeNode(node.data);

        setNodes(prev => {
            const newNodes = [...prev];
            newNodes[nodeChangeIndex] = serializeNode(newStateStep, {
                position: node.position,
                data: {isChangedStep: true}
            });
            return newNodes;
        });

        if (isDiff) {
            if (!!ORIGINAL_STEPS[stepChangedId]) {
                const index = stepsChanged.findIndex(s => s.id === stepChangedId);
                if (index !== -1) {
                    setStepsChanged(prev => {
                        const newData = [...prev];
                        newData[index] = newStateStep;
                        return newData;
                    });
                } else {
                    setStepsChanged(prev => {
                        const newData = [...prev];
                        newData.push(newStateStep);
                        return newData;
                    });
                }
            } else {
                console.log("set new node ", stepChangedId)
                setNewStepAdded(prev => {
                    return prev.map(s => {
                        if (s.id === stepChangedId) {
                            return newStateStep;
                        }
                        return s;
                    });
                })
            }
        }
    }

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('application/reactflow-node');
        if (!raw) return;
        const step = JSON.parse(raw);

        onAddNodeToWorkflow({...step, workflowId}, event.clientX, event.clientY);
    }, [workflowId]);

    const updateWorkFlowStep = useCallback(() => {
        if (stepsChanged.length === 0 && newStepsAdded.length === 0) return;
        console.log("stepsChanged", stepsChanged);

        setLoading(true);
        queueUpdateStep(stepsChanged, newStepsAdded).then(() => {
            showToast.call(masterToast, "success", "Thông báo", "Cập nhật thành công.");
            setForceReload(prev => prev + 1);
        }).catch((e) => {
            showToast.call(masterToast, "error", "Lỗi", e.message || "Cập nhật thất bại, vui lòng thử lại sau.");
        }).finally(() => setLoading(false));
    }, [stepsChanged, newStepsAdded]);

    const onDeleteNode = (nodeId) => {
        return confirmDialog({
            message: () => {
                return <span>Thao tác sẽ xóa vĩnh viễn Bước này và không thể khôi phục.</span>
            },
            header: 'Thông báo',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Đồng ý',
            rejectLabel: 'Hủy',
            defaultFocus: 'accept',
            group: 'WorkFlowDetailNew',
            accept() {
                const node = nodes.find(n => n.id === nodeId);
                if (node && node.data.id) {
                    setLoading(true);
                    deleteWorkflowStep({id: node.data.id}).then(r => {
                        showToast.call(masterToast, "success", "Thông báo", `Đã xóa ${node.data.description}`);
                        setForceReload(prev => prev + 1);
                    }).catch(e => {
                        showToast.call(masterToast, "error", "Lỗi", e.message || "Xóa thất bại, vui lòng thử lại sau.");
                    }).finally(() => setLoading(false));
                }
            }
        })
    }

    function computeStepToNode(originData) {
        const {nodes, edges} = convertBackendToFlow(originData);
        const laid = applyDagreLayout(nodes, edges);
        setNodes(laid.nodes);
        setEdges(laid.edges);
    }

    function resetEditorFromNode() {
        if (!selectedNode) {
            return setNodeEditor(null);
        }
        console.log("selectedNode", selectedNode)
        setRightTabViewActiveIndex(0);
        setShowRSidebar(true);
        setNodeEditor({...selectedNode});
    }

    function onAddNodeToWorkflow(step, x, y) {
        const inst = reactFlowInstanceRef.current;
        let position = inst.screenToFlowPosition({x, y});
        const newId = MAX_STEP_ORDER + 1;

        const updatedStep = {...step, stepOrder: newId, id: Date.now()};

        const newNode = serializeNode(updatedStep, {position, data: {isNewStep: true}});

        setNodes(nds => nds.concat(newNode));
        setSelectedNodeId(newId);
        setNewStepAdded(prev => [...prev, updatedStep]);
        setTimeout(() => {
            if (inst) {
                inst.setCenter(position.x, position.y, {zoom: 1.5, duration: 300});
            }
        }, 0);

        MAX_STEP_ORDER = newId;
    }

    function onEditorAddCase() {
        setNodeEditor(prev => {
            prev.data.transitions.cases.push({
                when: {
                    field: "",
                    op: "",
                    value: ""
                },
                next: ""
            });

            return {
                ...prev
            }
        })
    }

    function onEditorDeleteCase(index) {
        setNodeEditor(prev => {
            const {transitions: {cases}} = prev.data;
            const newCases = cases.splice(index, 1);

            return {
                ...prev,
                cases: newCases
            }
        })
    }

    function onEditorChangeTransition(index, field, value) {
        setNodeEditor(prev => {
            const newProps = {...prev};

            if (newProps.data.stepType === stepType.switch) {
                const newCases = [...newProps.data.transitions.cases];
                if (index === null) {
                    if (field === "next") {
                        newProps.data.transitions.next = value;
                    }
                } else if (field === "next") {
                    newCases[index].next = value;
                } else {
                    newCases[index].when[field] = value;
                }

                newProps.data.transitions.cases = newCases;
            }

            if (newProps.data.stepType === stepType.if) {
                console.log("field")
                if (field === "onTrue") {
                    newProps.data.transitions.onTrue.next = value;
                } else {
                    newProps.data.transitions.onFalse.next = value;
                }
            }


            return newProps;
        })
    }

    function onEditorChangeGuard(field, value) {
        setNodeEditor(prev => {
            const newProps = {...prev};

            const newGuard = {...newProps.data.guard};
            newGuard[field] = value;

            newProps.data.guard = newGuard;

            return newProps;
        })
    }

    function onEditorChangeData(newData) {
        if (newData) {
            setNodeEditor(prev => {
                return {
                    ...prev,
                    data: newData
                }
            })
        }
    }

    function onConnectNode({source, target}) {
        console.log("onConnectNode", source, target);

        if (target === "1") {
            // nếu là bước đầu tiên thì không cho kết nối
            return;
        }

        const nodeIndex = nodes.findIndex(n => n.id === source);

        if (nodeIndex === -1) {
            return;
        }

        const targetNodeIndex = nodes.findIndex(n => n.id === target);
        if (targetNodeIndex === -1) {
            return;
        }

        const sourceNode = nodes[nodeIndex];
        const {data: {stepType: sourceStepType}} = sourceNode;

        // kiểm tra target có hợp lệ không
        const targetEdge = edges.find(e => e.target === target);

        if (['switch', 'if'].includes(sourceStepType)) {
            if (sourceStepType === stepType.if) {
                const transitions = sourceNode.data.transitions;
                if (!!transitions.onTrue.next && !!transitions.onFalse.next) {
                    return showToast.call(masterToast, 'error', 'Thông báo', 'Liên kết không hợp lệ');
                }
            } else if (sourceStepType === stepType.switch) {
                const transitions = sourceNode.data.transitions;
                if (transitions.next && !transitions.cases.find(c => !c.next)) {
                    return showToast.call(masterToast, 'error', 'Thông báo', 'Liên kết không hợp lệ');
                }
            }
        }

        if (targetEdge) {
            console.log("targetEdge", targetEdge);
            // kiểm tra không phải là liên kết hiện tại thì thông báo lỗi
            if (targetEdge.source === source) {
                return;
                //return showToast.call(masterToast, 'error', 'Thông báo', 'Liên kết không hợp lệ. Node này đã có Bước khác kết nối.');
            }
        }

        const newEdge = {
            id: `${source}-${target}-${Date.now()}`,
            source: source,
            target: target,
            ...DEFAULT_EDGE
        }

        console.log("newEdge", newEdge);

        setEdges((edges) => {
            if (['switch', 'if'].includes(sourceStepType)) {
                if (sourceStepType === stepType.if) {
                    const transitions = sourceNode.data.transitions;

                    const filterId = !transitions.onTrue.next ? `${sourceNode.data.stepOrder}-true` : `${sourceNode.data.stepOrder}-false`

                    const newEdges = edges.filter(e => e.id !== filterId);

                    const newEdge = {
                        id: filterId,
                        source: source,
                        target: target,
                        label: !transitions.onTrue.next ? 'Đúng' : 'Sai',
                        ...DEFAULT_EDGE
                    }

                    return [...newEdges, newEdge];
                } else if (sourceStepType === stepType.switch) {
                    const transitions = sourceNode.data.transitions;
                    if (!transitions.next) {
                        const newEdges = edges.filter(e => e.id !== `${sourceNode.data.stepOrder}-default`);

                        const newEdge = {
                            id: `${sourceNode.data.stepOrder}-default`,
                            source: source,
                            target: target,
                            label: 'Mặc định',
                            ...DEFAULT_EDGE
                        }

                        return [...newEdges, newEdge];
                    } else {
                        const indexCase = transitions.cases.findIndex(c => !c.next);
                        if (indexCase === -1) {
                            return [...edges];
                        }

                        const newEdges = edges.filter((e) => e.id !== `${sourceNode.data.stepOrder}-case-${indexCase}`);

                        const newEdge = {
                            id: `${sourceNode.data.stepOrder}-case-${indexCase}`,
                            source: source,
                            target: target,
                            label: conditionToLabel(transitions.cases[indexCase].when),
                            ...DEFAULT_EDGE
                        }

                        return [...newEdges, newEdge];
                    }
                }
                return [...edges, newEdge];
            }

            const newEdges = edges.filter(e => e.source !== source);

            return [...newEdges, newEdge];
        });

        const updateSourceNode = {...sourceNode};
        let transitions = updateSourceNode.data.transitions;
        if (['switch', 'if'].includes(sourceStepType)) {
            if (sourceStepType === stepType.if) {
                if (!transitions.onTrue.next) {
                    transitions.onTrue.next = target;
                } else if (!transitions.onFalse.next) {
                    transitions.onFalse.next = target;
                }
            } else if (sourceStepType === stepType.switch) {
                if (!transitions.next) {
                    transitions.next = target;
                } else {
                    const indexCase = transitions.cases.findIndex(c => !c.next);
                    if (indexCase !== -1) {
                        transitions.cases[indexCase].next = target;
                    }
                }
            }
        } else {
            if (!transitions) {
                transitions = JSON.stringify({next: +target});
            } else {
                transitions.next = +target;
            }
        }
        updateSourceNode.data.isChangedStep = true;
        updateSourceNode.data.transitions = transitions;

        applyNodeEdits(updateSourceNode);
    }

    async function queueUpdateStep(updateData, newData) {
        if (updateData.length) {
            for (let i = 0; i < updateData.length; i++) {
                await updateWorkflowStep(computeStepBeforeSaveBE(updateData[i]));
            }
        }
        if (newData.length) {
            await createWorkflowStep(newData.map(s => {
                const {id, ...res} = s;
                return res;
            }));
        }
    }

    function onResetAllStepStateOriginal() {
        return confirmDialog({
            message: () => {
                return <span>Thao tác sẽ khôi phục tất cả thay đổi về thời điểm <strong>Lưu</strong> gần nhất.</span>
            },
            header: 'Thông báo',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Đồng ý',
            rejectLabel: 'Hủy',
            defaultFocus: 'accept',
            group: 'WorkFlowDetailNew',
            accept() {
                computeStepToNode(ORIGINAL_STEPS.all);
                setSelectedNodeId(null);
                setStepsChanged([]);
                setNewStepAdded([]);
                showToast.call(masterToast, "success", "Thông báo", "Tất cả thay đổi đã được khôi phục.");
            }
        })
    }

    function onShowPanelNodes() {
        if (!showRSidebar) {
            setShowRSidebar(true);
        }

        if (rightTabViewActiveIndex !== 1) {
            setTimeout(() => setRightTabViewActiveIndex(1), 500)
        }
    }

    return <div className="px-3 overflow-hidden workflow-builder h-full flex flex-column"
                style={{backgroundColor: '#edf1f5'}}>
        <div className="flow-header flex align-items-center mt-2">
            <h1 className="text-2xl m-0 mr-auto flex align-items-center">
                {/*<NavLink to={ROUTE_LINK.F.WORKFLOW(role)[0]}>
                    <i className="pi pi-arrow-left"></i>
                </NavLink>*/}
                <span className="mx-2">{`Workflow: ${workflowInfo.name}`}</span>
            </h1>
            {canSendUpdateStep && <small className="text-gray-500 mr-2">{loading ? 'Đang lưu' : 'Chưa lưu'}</small>}
            <div>
                <Button loading={loading} label="Lưu cập nhật" icon="pi pi-save" size="small"
                        onClick={updateWorkFlowStep}
                        disabled={!canSendUpdateStep}/>
                {stepsChanged.length > 0 &&
                    <Button text loading={loading} label="Khôi phục tất cả" icon="pi pi-refresh" size="small"
                            disabled={!canSendUpdateStep} onClick={onResetAllStepStateOriginal}/>}
            </div>
        </div>

        <div className="tools-box flex align-items-center my-2">
            <div className="tools-panel ml-auto">
                <Button icon={() => <img src={SVGSideBarCollapse} alt="icon-side-collapse"/>} className="p-0"
                        text disabled={showRSidebar}
                        style={{width: 'unset'}} onClick={() => setShowRSidebar(true)}/>
                <Button disabled={!showRSidebar}
                        icon={() => <img src={SVGSideBarExpand} alt="icon-side-expand"/>} className="p-0 mr-1" text
                        style={{width: 'unset'}} onClick={() => setShowRSidebar(false)}/>
            </div>
        </div>

        <div className="flex-1 flex pb-2 relative">
            <div className="left-sidebar flex flex-1" style={{
                marginRight: showRSidebar ? '355px' : 'unset',
                transition: 'margin-right .2s',
            }}>
                <div className="bg-white shadow-1 border-1 border-gray-50 border-round flex-1" onContextMenu={(e) => {
                    e.stopPropagation();
                    mainContextMN?.current && mainContextMN.current.show(e);
                }}>
                    <FlowProvider value={{
                        onDeleteNode, onEditNode: (nodeId) => {
                            setSelectedNodeId(nodeId)
                        }
                    }}>
                        <ReactFlow
                            onInit={instance => reactFlowInstanceRef.current = instance}
                            ref={reactFlowInstanceRef}
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={(e, node) => setSelectedNodeId(node.id)}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onConnect={(params) => {
                                onConnectNode(params);
                            }}
                        >
                            <Controls/>
                            <Background/>
                        </ReactFlow>
                    </FlowProvider>

                    <WorkflowContainerContextMenu cm={mainContextMN} onAddNode={onShowPanelNodes}/>
                </div>
            </div>
            <div className="right-sidebar absolute top-0 bottom-0 pb-2" style={{
                width: '350px',
                transition: 'transform 0.2s, right 0.2s',
                right: showRSidebar ? 0 : "-20px",
                transform: showRSidebar ? 'unset' : 'translateX(100%)',
            }}>
                <div className="shadow-1 border-1 border-gray-50 border-round overflow-y-auto bg-white-alpha-80"
                     title="Right Panel">
                    <TabView activeIndex={rightTabViewActiveIndex} pt={{
                        panelContainer: {
                            className: 'p-2 bg-white-alpha-80'
                        }
                    }} onTabChange={(e) => setRightTabViewActiveIndex(e.index)}>
                        <TabPanel header="Bước đang chọn">
                            {!selectedNode || !!!nodeEditor ? (
                                <div style={{opacity: 0.8}}>Chọn một "Bước" ở khung bên trái để chỉnh sửa.</div>
                            ) : <div>
                                <div className="flex gap-2 mb-3 align-items-end">
                                    <h3 className="text-xl m-0 mr-auto">
                                        <small
                                            className="text-overflow-ellipsis block white-space-nowrap overflow-hidden"
                                            style={{maxWidth: '165px'}} title={nodeEditor.data.description}>
                                            {nodeEditor.data.description}
                                        </small>
                                    </h3>
                                    <Button size="small" className="p-2" label="Áp dụng" icon="pi pi-check"
                                            loading={loading}
                                            onClick={() => applyNodeEdits(nodeEditor)}/>
                                    <Button size="small" className="p-2" label="Reset" icon="pi pi-undo"
                                            severity="secondary" text
                                            loading={loading}
                                            onClick={resetEditorFromNode}/>
                                </div>

                                <div className="p-2 border-1 border-gray-300 border-round shadow-1 bg-white">
                                    <WorkflowStepDetail step={nodeEditor.data} readOnly
                                                        onChange={(nodeData) => {
                                                            console.log("onChange", nodeData);
                                                            onEditorChangeData(nodeData)
                                                        }}/>
                                </div>

                                {[stepType.if, stepType.switch].includes(nodeEditor.data.stepType) &&
                                    <div className="mt-3">
                                        <h3 className="text-xl">Nhánh</h3>
                                        {stepType.switch === nodeEditor.data.stepType && <div>
                                            <div
                                                className="p-2 bg-white border-1 border-gray-300 border-round shadow-1 mb-2">
                                                <h4 className="flex align-items-center justify-content-between text-sm mb-1 mt-0">
                                                    <span className="text-gray-500">
                                                        Nhánh mặc định:
                                                        <InputText className="p-1 text-sm"
                                                                   value={nodeEditor.data.transitions.next}
                                                                   onChange={e => {
                                                                       onEditorChangeTransition(null, 'next', e.target.value);
                                                                   }}/>
                                                    </span>
                                                </h4>
                                            </div>

                                            {nodeEditor.data.transitions.cases.map((cas, index) => {
                                                return <div key={index}>
                                                    <div
                                                        className="p-2 bg-white border-1 border-gray-300 border-round shadow-1 mb-2">
                                                        <EditorCondition cas={cas.when}
                                                                         onChange={(field, value) => {
                                                                             onEditorChangeTransition(index, field, value);
                                                                         }}/>
                                                        <h4 className="flex align-items-center justify-content-between text-sm mt-1 mb-0">
                                                            <span>
                                                                Bước tiếp theo: <InputText className="p-1 text-sm"
                                                                                           value={cas.next}
                                                                                           onChange={e => {
                                                                                               onEditorChangeTransition(index, 'next', e.target.value);
                                                                                           }}/>
                                                            </span>
                                                            <Button label="Xóa" text severity="danger"
                                                                    className="text-sm"
                                                                    onClick={() => onEditorDeleteCase(index)}/>
                                                        </h4>
                                                    </div>
                                                </div>
                                            })}

                                            <div className="mt-3">
                                                <Button label="Thêm nhánh" icon="pi pi-plus" size="small"
                                                        onClick={(e) => {
                                                            onEditorAddCase();
                                                        }}
                                                        className="px-3 py-2" outlined type="button"/>
                                            </div>
                                        </div>}

                                        {stepType.if === nodeEditor.data.stepType && <div>
                                            <div className="p-2 border-1 border-gray-300 border-round shadow-1 mb-2">
                                                <EditorCondition cas={nodeEditor.data.guard}
                                                                 onChange={(field, value) => {
                                                                     onEditorChangeGuard(field, value);
                                                                 }}/>
                                            </div>
                                            <div className="grid">
                                                <div className="col-6 mt-2">
                                                    <label htmlFor="case-value">Bước tiếp theo <small
                                                        className="text-green-500">(Nếu đúng)</small></label>
                                                    <InputText size="small" className="w-full"
                                                               id="case-value"
                                                               onChange={e => {
                                                                   onEditorChangeTransition(null, 'onTrue', e.target.value);
                                                               }}
                                                               value={nodeEditor.data.transitions?.onTrue?.next}/>
                                                </div>
                                                <div className="col-6 mt-2">
                                                    <label htmlFor="case-value">Bước tiếp theo <small
                                                        className="text-red-500">(Nếu sai)</small></label>
                                                    <InputText size="small" className="w-full"
                                                               id="case-value"
                                                               onChange={e => {
                                                                   onEditorChangeTransition(null, 'onFalse', e.target.value);
                                                               }}
                                                               value={nodeEditor.data.transitions?.onFalse?.next}/>
                                                </div>
                                            </div>
                                        </div>}
                                    </div>
                                }
                            </div>}
                        </TabPanel>
                        <TabPanel header="Tạo một bước mới">
                            <div className="grid">
                                {getDemoNodes().map(node => (
                                    <div key={node.stepType} className="col-6">
                                        <div
                                            className="p-2 bg-white border-1 border-gray-300 border-round justify-content-center cursor-move flex align-items-center"
                                            style={{height: 45}} draggable
                                            onDragStart={(event) => {
                                                event.dataTransfer.setData('application/reactflow-node', JSON.stringify(node));
                                                event.dataTransfer.effectAllowed = 'move';
                                            }}>
                                            <div className="text-center">{node.description || node.stepType}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2">
                                <p className=""><i>Kéo/Thả Mẫu vào Workflow để thêm Bước mới</i></p>
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
        </div>

        <ConfirmDialog group="WorkFlowDetailNew"/>
    </div>;
}

const nodeTypes = {
    default: (props) => <CustomNode {...props}/>,
}

function CustomNode({data, id}) {
    const cm = useRef(null);
    const {onDeleteNode, onEditNode} = useFlow();

    return (
        <div className="p-2 flex align-items-center justify-content-center" style={{width: 120, height: 45}}
             onContextMenu={e => {
                 e.stopPropagation();
                 cm?.current && cm.current.show(e);
             }}>
            <div className={classNames("absolute left-0 top-0 right-0 bottom-0", {
                'bg-green-50': data.isNewStep,
                'bg-blue-50': data.isChangedStep && !data.isNewStep,
            })} style={{zIndex: -1}}></div>
            <div className="text-sm">{data.label}</div>

            <div className="absolute left-0 top-0 flex w-full pointer-events-none">
                <small className="block" style={{
                    fontSize: '.5rem',
                    padding: "0.15rem",
                    backgroundColor: "#edf1f5"
                }}>{stepTypeLabel[data.stepType]}</small>
            </div>
            <Handle type="target" position={Position.Left}/>
            <Handle type="source" position={Position.Right}/>

            <NodeContextMenu cm={cm} onDelete={() => {
                onDeleteNode(id);
            }} onEdit={() => onEditNode(id)}/>
        </div>
    );
}

function NodeContextMenu({cm, onDelete, onEdit}) {
    const selfCm = useRef(null);
    const items = [
        {label: 'Chỉnh sửa', icon: 'pi pi-pencil', command: () => onEdit && onEdit()},
        {label: 'Xóa', icon: 'pi pi-times', command: () => onDelete && onDelete()}
    ];

    useEffect(() => {
        if (cm && selfCm.current) {
            cm.current = selfCm.current;
        }
    }, [])

    return <ContextMenu model={items} ref={selfCm} breakpoint="767px"/>
}

function WorkflowContainerContextMenu({cm, onAddNode}) {
    const selfCm = useRef(null);
    const items = [
        {label: 'Tạo Bước mới', icon: 'pi pi-pencil', command: () => onAddNode && onAddNode()}
    ];

    useEffect(() => {
        if (cm && selfCm.current) {
            cm.current = selfCm.current;
        }
    }, [])

    return <ContextMenu model={items} ref={selfCm} breakpoint="767px"/>
}

function EditorCondition({cas, onChange}) {
    const randUID = randomString(6);
    const [source, setSource] = useState("");
    const [fieldOptions, setFieldOptions] = useState(OPTIONS_FIELDS.filter(f => f.source === source));

    useEffect(() => {
        if (cas && cas.field && /^\w+\.\w+$/i.test(cas.field)) {
            setSource(cas?.field?.split('.')[0]);
        } else {
            setSource("user");
        }
    }, [cas]);

    useEffect(() => {
        setFieldOptions(OPTIONS_FIELDS.filter(f => f.source === source));
    }, [source]);

    return <>
        <div className="grid">
            <div className="col-6">
                <label htmlFor={`field-${randUID}`}>Nguồn</label>
                <Dropdown value={source} inputId={`field-${randUID}`}
                          options={TRANSITION_SOURCE}
                          onChange={e => setSource(e.target.value)}
                          placeholder="Chọn nguồn dữ liệu"
                          style={EDITOR_FIELD_STYLE} className="w-full"/>
            </div>
            <div className="col-6">
                <label htmlFor={`field-${randUID}`}>Trường</label>
                <Dropdown value={cas.field} inputId={`field-${randUID}`}
                          options={fieldOptions}
                          onChange={e => onChange("field", e.value)}
                          placeholder="chọn trường để so sánh"
                          style={EDITOR_FIELD_STYLE} className="w-full"/>
            </div>
        </div>
        <div className="grid">
            <div className="col-6">
                <label htmlFor={`op-${randUID}`}>Loại so sánh</label>
                <Dropdown value={cas.op} inputId={`op-${randUID}`}
                          options={COMPARES}
                          placeholder="Chọn loại so sánh"
                          onChange={e => onChange("op", e.value)}
                          style={EDITOR_FIELD_STYLE} className="w-full"/>
            </div>
            <div className="col-6">
                <label htmlFor={`val-${randUID}`}>Giá trị so sánh</label>
                <InputText style={EDITOR_FIELD_STYLE} className="w-full"
                           id={`val-${randUID}`}
                           onChange={e => onChange("value", e.target.value)}
                           value={cas.value}/>
            </div>
        </div>
    </>
}

function applyDagreLayout(nodes, edges, options = {}) {
    const {
        direction = 'LR',
        nodeWidth = 180,
        nodeHeight = 60,
        nodesep = 50,
        ranksep = 100,
        edgesep = 10,
        marginx = 20,
        marginy = 20,
        multigraph = true,
    } = options;

    const g = new dagre.graphlib.Graph({multigraph});
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({rankdir: direction, nodesep, ranksep, edgesep, marginx, marginy});

    nodes.forEach((n) => {
        g.setNode(n.id, {width: nodeWidth, height: nodeHeight});
    });

    edges.forEach((e) => {
        g.setEdge(e.source, e.target, {}, e.id);
    });

    dagre.layout(g);

    const isHorizontal = direction === 'LR' || direction === 'RL';

    const layoutedNodes = nodes.map((n) => {
        const pos = g.node(n.id); // { x, y }
        return {
            ...n,
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',
            position: {
                x: pos.x - nodeWidth / 2,
                y: pos.y - nodeHeight / 2,
            },
        };
    });

    return {nodes: layoutedNodes, edges};
}

function convertBackendToFlow(steps) {
    const nodes = [];
    const edges = [];

    steps.forEach((step) => {
        const node = serializeNode(step, {
            className: 'node-container'
        });
        // Node
        nodes.push(node);

        const {transitions} = node.data;

        // Edges
        if (transitions) {
            if (transitions.onTrue || transitions.onFalse) {
                if (transitions.onTrue && transitions.onTrue.next) {
                    edges.push({
                        id: `${step.stepOrder}-true`,
                        source: String(step.stepOrder),
                        target: String(transitions.onTrue.next),
                        label: 'Đúng',
                        ...DEFAULT_EDGE
                    });
                }
                if (transitions.onFalse && transitions.onFalse.next) {
                    edges.push({
                        id: `${step.stepOrder}-false`,
                        source: String(step.stepOrder),
                        target: String(transitions.onFalse.next),
                        label: 'Sai',
                        ...DEFAULT_EDGE
                    });
                }
            } else if (transitions.cases?.length) {
                transitions.cases.forEach((c, idx) => {
                    if (c.next) {
                        edges.push({
                            id: `${step.stepOrder}-case-${idx}`,
                            source: String(step.stepOrder),
                            target: String(c.next),
                            label: conditionToLabel(c.when),
                            ...DEFAULT_EDGE
                        });
                    }
                });
                if (transitions.next) {
                    edges.push({
                        id: `${step.stepOrder}-default`,
                        source: String(step.stepOrder),
                        target: String(transitions.next),
                        label: 'Mặc định',
                        ...DEFAULT_EDGE
                    });
                }
            } else {
                if (transitions.next) {
                    edges.push({
                        id: `${step.stepOrder}-default`,
                        source: String(step.stepOrder),
                        target: String(transitions.next),
                        ...DEFAULT_EDGE
                    });
                }
            }
        }
    });

    return {nodes, edges};
}

function isStepDataChanged(stepId, nodeData) {
    const original = ORIGINAL_STEPS[stepId];
    if (!original) return true;

    const current = JSON.stringify(deserializeNode(nodeData));
    return original.hash !== current;

}


function computeStepBeforeSaveBE(step) {
    const newStep = {...step};

    INT_FIELDS_STEP.forEach(field => {
        if (newStep[field] !== undefined) {
            newStep[field] = !newStep[field] ? null : parseInt(newStep[field], 10);
        }
    });

    const arrUseValue = stepFieldConfig[newStep.stepType];
    if (arrUseValue && arrUseValue.length > 0 && !arrUseValue.includes("value")) {
        newStep.value = null;
    }

    const arrUseValueExtra = stepFieldConfig[newStep.stepType];
    if (arrUseValueExtra && arrUseValueExtra.length > 0 && !arrUseValueExtra.includes("valueExtra")) {
        newStep.valueExtra = "";
    }

    const arrUseTemplateId = stepFieldConfig[newStep.stepType];
    if (arrUseTemplateId && arrUseTemplateId.length > 0 && !arrUseTemplateId.includes("templateId")) {
        newStep.templateId = null;
    }

    return newStep;
}
