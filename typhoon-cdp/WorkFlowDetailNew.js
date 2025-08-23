import {useEffect} from "react";
import React, {useMemo, useState} from 'react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import {ReactFlow, Background, Controls, MiniMap, ReactFlowProvider} from '@xyflow/react';

// PrimeReact components
import {Card} from 'primereact/card';
import {InputText} from 'primereact/inputtext';
import {Dropdown} from 'primereact/dropdown';
import {Button} from 'primereact/button';
import {InputTextarea} from 'primereact/inputtextarea';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';

export default function WorkFlowDetailNew() {
    const [workflowInfo, setWorkflowInfo] = useState(workflowInfoDefault());
    const [graph, setGraph] = useState({nodes: [], edges: []});
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        const base = convertBackendToFlow(rawData.data)
        const laidOutNodes = applyDagreLayout(base.nodes, base.edges);
        setGraph(laidOutNodes);
    }, []);

    useEffect(() => {
        console.log(graph)
    }, [graph])

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

const rawData = {
    "status": 1,
    "message": "ok",
    "data": [
        {
            "id": 1,
            "workflowId": 1,
            "stepOrder": 1,
            "stepType": "add_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_active",
            "params": "",
            "description": "Tag: booking_active",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 2,
            "workflowId": 1,
            "stepOrder": 2,
            "stepType": "send_message",
            "templateId": 35,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Xác nhận đặt lịch (35)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 3,
            "workflowId": 1,
            "stepOrder": 3,
            "stepType": "switch",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Router theo tier",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "{\"cases\":[{\"when\":{\"field\":\"user.tierId\",\"op\":\"eq\",\"value\":3},\"next\":100},{\"when\":{\"field\":\"user.tierId\",\"op\":\"eq\",\"value\":2},\"next\":200}],\"defaultNext\":300}",
            "waitPolicy": ""
        },
        {
            "id": 4,
            "workflowId": 1,
            "stepOrder": 100,
            "stepType": "wait",
            "templateId": null,
            "value": -172800,
            "valueExtra": "",
            "params": "",
            "description": "VIP: nhắc trước 2 ngày",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 5,
            "workflowId": 1,
            "stepOrder": 101,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Nhắc -2d (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 6,
            "workflowId": 1,
            "stepOrder": 102,
            "stepType": "wait",
            "templateId": null,
            "value": -21600,
            "valueExtra": "",
            "params": "",
            "description": "VIP: nhắc trước 6 giờ",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 7,
            "workflowId": 1,
            "stepOrder": 103,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Nhắc -6h (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 8,
            "workflowId": 1,
            "stepOrder": 104,
            "stepType": "wait",
            "templateId": null,
            "value": -3600,
            "valueExtra": "",
            "params": "",
            "description": "VIP: nhắc trước 1 giờ",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 9,
            "workflowId": 1,
            "stepOrder": 105,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Nhắc -1h (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 10,
            "workflowId": 1,
            "stepOrder": 106,
            "stepType": "if",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: nếu cuối tuần thêm nhắc -12h",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "{\"field\":\"ctx.isWeekend\",\"op\":\"eq\",\"value\":true}",
            "transitions": "{\"onTrue\":108,\"onFalse\":110}",
            "waitPolicy": ""
        },
        {
            "id": 11,
            "workflowId": 1,
            "stepOrder": 108,
            "stepType": "wait",
            "templateId": null,
            "value": -43200,
            "valueExtra": "",
            "params": "",
            "description": "VIP: nhắc thêm -12h (cuối tuần)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 12,
            "workflowId": 1,
            "stepOrder": 109,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Nhắc -12h (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 13,
            "workflowId": 1,
            "stepOrder": 110,
            "stepType": "wait",
            "templateId": null,
            "value": -1800,
            "valueExtra": "",
            "params": "",
            "description": "VIP: -30 phút trước giờ hẹn",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 14,
            "workflowId": 1,
            "stepOrder": 111,
            "stepType": "if",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Copy khác theo giới tính",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "{\"any\":[{\"field\":\"user.gender\",\"op\":\"eq\",\"value\":\"Female\"},{\"field\":\"user.gender\",\"op\":\"eq\",\"value\":\"Nữ\"}]}",
            "transitions": "{\"onTrue\":112,\"onFalse\":113}",
            "waitPolicy": ""
        },
        {
            "id": 15,
            "workflowId": 1,
            "stepOrder": 112,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Nhắc -30m (Nữ) (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 16,
            "workflowId": 1,
            "stepOrder": 113,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Nhắc -30m (Nam/khác) (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 17,
            "workflowId": 1,
            "stepOrder": 114,
            "stepType": "switch",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Router khung giờ",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "{\"cases\":[{\"when\":{\"field\":\"ctx.bookingHour\",\"op\":\"lt\",\"value\":12},\"next\":115},{\"when\":{\"all\":[{\"field\":\"ctx.bookingHour\",\"op\":\"gte\",\"value\":12},{\"field\":\"ctx.bookingHour\",\"op\":\"lt\",\"value\":18}]},\"next\":116}],\"defaultNext\":117}",
            "waitPolicy": ""
        },
        {
            "id": 18,
            "workflowId": 1,
            "stepOrder": 115,
            "stepType": "wait",
            "templateId": null,
            "value": -10800,
            "valueExtra": "",
            "params": "",
            "description": "VIP: sáng — nhắc -3h",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 19,
            "workflowId": 1,
            "stepOrder": 116,
            "stepType": "wait",
            "templateId": null,
            "value": -10800,
            "valueExtra": "",
            "params": "",
            "description": "VIP: chiều — nhắc -3h",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 20,
            "workflowId": 1,
            "stepOrder": 117,
            "stepType": "wait",
            "templateId": null,
            "value": -10800,
            "valueExtra": "",
            "params": "",
            "description": "VIP: tối — nhắc -3h",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 21,
            "workflowId": 1,
            "stepOrder": 118,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Nhắc -3h theo khung giờ (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 22,
            "workflowId": 1,
            "stepOrder": 119,
            "stepType": "wait",
            "templateId": null,
            "value": 10800,
            "valueExtra": "",
            "params": "",
            "description": "VIP: +3 giờ sau lịch",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 23,
            "workflowId": 1,
            "stepOrder": 120,
            "stepType": "call_api",
            "templateId": null,
            "value": null,
            "valueExtra": "https://api.yourdomain/checkAttendance",
            "params": "",
            "description": "Gọi API kiểm tra có đi đặt lịch",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 24,
            "workflowId": 1,
            "stepOrder": 121,
            "stepType": "if",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: if attended",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "{\"field\":\"ctx.attended\",\"op\":\"eq\",\"value\":true}",
            "transitions": "{\"onTrue\":130,\"onFalse\":140}",
            "waitPolicy": ""
        },
        {
            "id": 25,
            "workflowId": 1,
            "stepOrder": 130,
            "stepType": "send_message",
            "templateId": 34,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Mời đánh giá (34)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 26,
            "workflowId": 1,
            "stepOrder": 131,
            "stepType": "add_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_success",
            "params": "",
            "description": "Tag: booking_success",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 27,
            "workflowId": 1,
            "stepOrder": 132,
            "stepType": "open_mini_app",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Mở Mini App",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 28,
            "workflowId": 1,
            "stepOrder": 133,
            "stepType": "remove_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_active",
            "params": "",
            "description": "Remove tag: booking_active",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 29,
            "workflowId": 1,
            "stepOrder": 140,
            "stepType": "give_voucher",
            "templateId": 12,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Tặng voucher xin lỗi",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 30,
            "workflowId": 1,
            "stepOrder": 141,
            "stepType": "send_message",
            "templateId": 28,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "VIP: Thông báo tặng voucher (28)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 31,
            "workflowId": 1,
            "stepOrder": 142,
            "stepType": "add_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_no_show",
            "params": "",
            "description": "Tag: booking_no_show",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 32,
            "workflowId": 1,
            "stepOrder": 143,
            "stepType": "remove_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_active",
            "params": "",
            "description": "Remove tag: booking_active",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 33,
            "workflowId": 1,
            "stepOrder": 200,
            "stepType": "wait",
            "templateId": null,
            "value": -86400,
            "valueExtra": "",
            "params": "",
            "description": "Gold: nhắc -1 ngày",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 34,
            "workflowId": 1,
            "stepOrder": 201,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: Nhắc -1d (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 35,
            "workflowId": 1,
            "stepOrder": 202,
            "stepType": "wait",
            "templateId": null,
            "value": -7200,
            "valueExtra": "",
            "params": "",
            "description": "Gold: nhắc -2 giờ",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 36,
            "workflowId": 1,
            "stepOrder": 203,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: Nhắc -2h (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 37,
            "workflowId": 1,
            "stepOrder": 204,
            "stepType": "if",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: nếu cuối tuần thêm -12h",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "{\"field\":\"ctx.isWeekend\",\"op\":\"eq\",\"value\":true}",
            "transitions": "{\"onTrue\":205,\"onFalse\":206}",
            "waitPolicy": ""
        },
        {
            "id": 38,
            "workflowId": 1,
            "stepOrder": 205,
            "stepType": "wait",
            "templateId": null,
            "value": -43200,
            "valueExtra": "",
            "params": "",
            "description": "Gold: -12h (cuối tuần)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 39,
            "workflowId": 1,
            "stepOrder": 206,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: Nhắc -12h (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 40,
            "workflowId": 1,
            "stepOrder": 207,
            "stepType": "wait",
            "templateId": null,
            "value": -1800,
            "valueExtra": "",
            "params": "",
            "description": "Gold: -30 phút",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 41,
            "workflowId": 1,
            "stepOrder": 208,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: Nhắc -30m (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 42,
            "workflowId": 1,
            "stepOrder": 209,
            "stepType": "wait",
            "templateId": null,
            "value": 10800,
            "valueExtra": "",
            "params": "",
            "description": "Gold: +3 giờ sau lịch",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 43,
            "workflowId": 1,
            "stepOrder": 210,
            "stepType": "call_api",
            "templateId": null,
            "value": null,
            "valueExtra": "https://api.yourdomain/checkAttendance",
            "params": "",
            "description": "Gold: Kiểm tra attendance",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 44,
            "workflowId": 1,
            "stepOrder": 211,
            "stepType": "if",
            "templateId": null,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: if attended",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "{\"field\":\"ctx.attended\",\"op\":\"eq\",\"value\":true}",
            "transitions": "{\"onTrue\":212,\"onFalse\":216}",
            "waitPolicy": ""
        },
        {
            "id": 45,
            "workflowId": 1,
            "stepOrder": 212,
            "stepType": "send_message",
            "templateId": 34,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: Mời đánh giá (34)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 46,
            "workflowId": 1,
            "stepOrder": 213,
            "stepType": "remove_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_active",
            "params": "",
            "description": "Remove tag: booking_active",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 47,
            "workflowId": 1,
            "stepOrder": 216,
            "stepType": "give_voucher",
            "templateId": 12,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: Voucher bù",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 48,
            "workflowId": 1,
            "stepOrder": 217,
            "stepType": "send_message",
            "templateId": 28,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Gold: Thông báo bù (28)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 49,
            "workflowId": 1,
            "stepOrder": 218,
            "stepType": "remove_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_active",
            "params": "",
            "description": "Remove tag: booking_active",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 50,
            "workflowId": 1,
            "stepOrder": 300,
            "stepType": "wait",
            "templateId": null,
            "value": -86400,
            "valueExtra": "",
            "params": "",
            "description": "Default: nhắc -1 ngày",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 51,
            "workflowId": 1,
            "stepOrder": 301,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Default: Nhắc -1d (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 52,
            "workflowId": 1,
            "stepOrder": 302,
            "stepType": "wait",
            "templateId": null,
            "value": -3600,
            "valueExtra": "",
            "params": "",
            "description": "Default: nhắc -1 giờ",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 53,
            "workflowId": 1,
            "stepOrder": 303,
            "stepType": "send_message",
            "templateId": 36,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Default: Nhắc -1h (36)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 54,
            "workflowId": 1,
            "stepOrder": 304,
            "stepType": "wait",
            "templateId": null,
            "value": 10800,
            "valueExtra": "",
            "params": "",
            "description": "Default: +3 giờ sau lịch",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 55,
            "workflowId": 1,
            "stepOrder": 305,
            "stepType": "send_message",
            "templateId": 34,
            "value": null,
            "valueExtra": "",
            "params": "",
            "description": "Default: Mời đánh giá (34)",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        },
        {
            "id": 56,
            "workflowId": 1,
            "stepOrder": 306,
            "stepType": "remove_tag",
            "templateId": null,
            "value": null,
            "valueExtra": "booking_active",
            "params": "",
            "description": "Remove tag: booking_active",
            "createdAt": 1755844683,
            "nextStepIfTrue": null,
            "nextStepIfFalse": null,
            "isEnd": false,
            "guard": "",
            "transitions": "",
            "waitPolicy": ""
        }
    ]
}