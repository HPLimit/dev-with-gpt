import {useCallback, useEffect} from "react";
import React, {useMemo, useState} from 'react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import {ReactFlow, Background, Controls, MiniMap, ReactFlowProvider} from '@xyflow/react';

import {Card} from 'primereact/card';
import {InputText} from 'primereact/inputtext';
import {Dropdown} from 'primereact/dropdown';
import {Button} from 'primereact/button';
import {InputTextarea} from 'primereact/inputtextarea';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {useFetchResources} from "../../../Component/Resources";
import {getAutomationStepList, getAutomationWorkflow} from "../../../../service/requestAPI";
import {useRole} from "../../../../hook";
import {useOutletContext, useParams} from "react-router-dom";
import {useSelector} from "react-redux";
import {getExtraValueParsedDefault} from "./common";

export default function WorkFlowDetailNew() {
    const role = useRole();
    const {workflowId} = useParams();
    const [masterToast] = useOutletContext();
    const partnerId = useSelector(({auth: {userid}}) => userid);
    const [forceReload, setForceReload] = useState(0);

    const [workflowInfo, setWorkflowInfo] = useState(workflowInfoDefault());
    const [graph, setGraph] = useState({nodes: [], edges: []});
    const [selectedNode, setSelectedNode] = useState(null);

    const [flowData, , loading, setLoading] = useFetchResources(useCallback(getAutomationWorkflow.bind(null, {
        partnerId, workflowId
    }), [partnerId, workflowId]), forceReload);

    const [stepsData, , loadingStepData] = useFetchResources(useCallback(getAutomationStepList.bind(null, {workflowId}), [workflowId]), forceReload);

    const [workflowTarget, setWorkflowTarget] = useState({});

    useEffect(() => {
        if (flowData && flowData.data) {

            const newData = flowData.data;

            let extraValueParsed = getExtraValueParsedDefault();

            try {
                if (newData.extraValue) {
                    const tmp = newData.extraValue && JSON.parse(newData.extraValue);
                    if (Object.keys(tmp).length > 0) {
                        extraValueParsed = tmp;
                    }
                }
            } catch (e) {
                console.error(e);
            }

            newData.extraValueParsed = extraValueParsed;
            setWorkflowInfo(newData);
            if (newData.extraValueParsed.target) {
                setWorkflowTarget(newData.extraValueParsed.target);
            }
        }
    }, [flowData]);

    useEffect(() => {
        if(stepsData.data) {
            const {nodes, edges} = convertBackendToFlow(stepsData.data);
            setGraph(applyDagreLayout(nodes, edges));
        }
    }, [stepsData]);

    // Layout styles
    const rootStyle = {
        display: 'grid',
        gridTemplateColumns: '260px 1fr 300px',
        gap: '.5em',
        height: '100vh',
        padding: '1rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
    };

    const colStyle = {height: '100%', overflow: 'hidden'};
    const midColStyle = {
        ...colStyle,
        display: 'grid',
        gridTemplateRows: '1fr 0.6fr',
        gap: '1rem',
    };

    const cardBodyStyle = {height: '100%', display: 'flex', flexDirection: 'column'};
    const formRow = {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '0.75rem',
        marginTop: '0.5rem',
    };
    const fieldGroup = {display: 'grid', gap: '0.25rem'};
    const grow = {flex: 1};
    const nodeTableContainer = {height: '100%', overflow: 'auto'};

    return (
        <div style={rootStyle}>
            {/* Left column: Workflow Info Form */}
            <section className="border border-1 border-round border-bluegray-100" style={colStyle}>
                <Card title="Workflow Info" subTitle="Thông tin tổng quan" style={cardBodyStyle}>
                    {workflowInfo && (
                        <div style={formRow}>
                            <div style={fieldGroup}>
                                <label htmlFor="wfName">Tên workflow</label>
                                <InputText id="wfName" value={workflowInfo.name} onChange={() => {
                                }}/>
                            </div>
                            <div style={fieldGroup}>
                                <label htmlFor="wfTrigger">Trigger type</label>
                                <Dropdown id="wfTrigger" value={workflowInfo.triggerType}
                                          options={[{label: 'booking', value: 'booking'}]} onChange={() => {
                                }}/>
                            </div>
                            <div style={fieldGroup}>
                                <label htmlFor="wfDesc">Mô tả</label>
                                <InputTextarea id="wfDesc" value={workflowInfo.description} onChange={() => {
                                }} rows={5} autoResize/>
                            </div>
                        </div>
                    )}
                </Card>
            </section>

            {/* Middle column: ReactFlow + Nodes table */}
            <section style={midColStyle}>
                <Card title="Workflow Canvas" style={cardBodyStyle}
                      className="border border-1 border-round border-bluegray-100">
                    <div style={{...grow, minHeight: 0}}>
                        <div style={{width: '100%', height: '60vh'}}>
                            <ReactFlowProvider>
                                <ReactFlow nodes={graph.nodes} edges={graph.edges} fitView>
                                    <MiniMap/>
                                    <Controls/>
                                    <Background/>
                                </ReactFlow>
                            </ReactFlowProvider>
                        </div>
                    </div>
                </Card>

                <Card title="Nodes" subTitle="Danh sách node" style={cardBodyStyle}
                      className="border border-1 border-round border-bluegray-100">
                    <div style={nodeTableContainer}>
                        <DataTable value={graph.nodes.map(n => n.data)} scrollable scrollHeight="flex"
                                   onRowClick={(e) => {
                                       setSelectedNode(e.data)
                                       console.log(e.data)
                                   }}>
                            <Column header="#" body={(rowData, {rowIndex}) => rowIndex + 1} style={{width: 60}}/>
                            <Column field="stepOrder" header="Step" style={{width: 100}}/>
                            <Column field="stepType" header="Type"/>
                            <Column field="label" header="Description"/>
                        </DataTable>
                    </div>
                </Card>
            </section>

            {/* Right column: Node Editor */}
            <section className="border border-1 border-round border-bluegray-100" style={colStyle}>
                <Card title="Node Editor" subTitle={selectedNode ? `Node: ${selectedNode.label}` : 'Chưa chọn node'}
                      style={cardBodyStyle}>
                    {!selectedNode && <div style={{opacity: 0.8}}>Chọn một node để chỉnh sửa.</div>}
                </Card>
            </section>
        </div>
    );
}

function workflowInfoDefault() {
    return {
        "id": 1,
        "partnerId": "",
        "name": "Booking Demo V3 — Full branching",
        "triggerType": "booking",
        "description": "Xác nhận, nhiều lớp nhắc, router cuối tuần/giới tính/khung giờ, hậu kiểm & bù voucher",
        "isActive": 1,
        "extraValue": "",
        "triggerConfig": "{\"supportsWeekendRoute\":true}",
        "audience": "{\"field\":\"user.idByOa\",\"op\":\"exists\",\"value\":null}",
        "createdAt": 1755844683
    };
}


function applyDagreLayout(nodes, edges, options = {}) {
    const {
        direction = 'LR',      // 'LR' | 'RL' | 'TB' | 'BT'
        nodeWidth = 180,
        nodeHeight = 60,
        nodesep = 50,
        ranksep = 100,
        edgesep = 10,
        marginx = 20,
        marginy = 20,
        multigraph = true,     // cho phép nhiều edge trùng source-target
    } = options;

    // Tạo graph và cấu hình layout
    const g = new dagre.graphlib.Graph({multigraph});
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({rankdir: direction, nodesep, ranksep, edgesep, marginx, marginy});

    // Khai báo kích thước node cho dagre
    nodes.forEach((n) => {
        g.setNode(n.id, {width: nodeWidth, height: nodeHeight});
    });

    // Khai báo edge cho dagre (truyền id để tránh đụng nhau khi multigraph)
    edges.forEach((e) => {
        g.setEdge(e.source, e.target, {}, e.id);
    });

    // Tính toán layout
    dagre.layout(g);

    const isHorizontal = direction === 'LR' || direction === 'RL';

    // Ánh x/y (tâm) của dagre sang topleft cho React Flow
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

    // Trả về đúng shape mà React Flow setNodes/setEdges đang dùng
    return {nodes: layoutedNodes, edges};
}

function convertBackendToFlow(steps) {
    const nodes = [];
    const edges = [];

    steps.forEach((step, index) => {
        let guard = null;
        let transitions = null;
        try {
            guard = step.guard ? JSON.parse(step.guard) : null;
        } catch {
        }
        try {
            transitions = step.transitions ? JSON.parse(step.transitions) : null;
        } catch {
        }

        // Node
        nodes.push({
            id: String(step.stepOrder),
            type: "default",
            position: {x: 0, y: 0},
            data: {
                label: `${step.stepOrder}: ${step.description}`,
                stepType: step.stepType,
                stepOrder: step.stepOrder,
                templateId: step.templateId,
                value: step.value,
                valueExtra: step.valueExtra,
                params: step.params,
                guard,
                transitions,
            },
        });

        // Edges
        if (transitions) {
            if (transitions.onTrue || transitions.onFalse) {
                if (transitions.onTrue) {
                    edges.push({
                        id: `${step.stepOrder}-true`,
                        source: String(step.stepOrder),
                        target: String(transitions.onTrue),
                        label: 'True',
                    });
                }
                if (transitions.onFalse) {
                    edges.push({
                        id: `${step.stepOrder}-false`,
                        source: String(step.stepOrder),
                        target: String(transitions.onFalse),
                        label: 'False',
                    });
                }
            } else if (transitions.cases) {
                transitions.cases.forEach((c, idx) => {
                    edges.push({
                        id: `${step.stepOrder}-case-${idx}`,
                        source: String(step.stepOrder),
                        target: String(c.next),
                        label: conditionToLabel(c.when),
                    });
                });
                if (transitions.defaultNext) {
                    edges.push({
                        id: `${step.stepOrder}-default`,
                        source: String(step.stepOrder),
                        target: String(transitions.defaultNext),
                        label: 'Default',
                    });
                }
            }
        } else {
            const nextStep = steps.find(s => s.stepOrder === step.stepOrder + 1);
            if (nextStep) {
                edges.push({
                    id: `${step.stepOrder}-${nextStep.stepOrder}`,
                    source: String(step.stepOrder),
                    target: String(nextStep.stepOrder),
                    label: ''
                });
            }
        }
    });

    return {nodes, edges};
}

function conditionToLabel(cond) {
    if (!cond) return '';
    if (cond.field) return `${cond.field} ${cond.op} ${cond.value}`;
    if (cond.any) return cond.any.map(conditionToLabel).join(' OR ');
    if (cond.all) return cond.all.map(conditionToLabel).join(' AND ');
    return JSON.stringify(cond);
}
