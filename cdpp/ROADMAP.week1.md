# Lộ trình phát triển: Tuần 1 03-09-2025 đến 09-09-2025

## Giai đoạn 1 – Khung nền tảng & seeding dữ liệu
1. **Thiết lập cấu trúc dự án**
    - Chuẩn hoá mô-đun: `event-source`, `workflow-engine`, `plugin-action`, `logging`.
    - Khởi tạo scripts seeding dữ liệu mẫu để kiểm thử nhanh core.
2. **Event Source service**
    - Lớp CRUD duy nhất để phát hiện thao tác dữ liệu, emit sự kiện nội bộ.
    - Lưu log sự kiện tối thiểu (để trace).
3. **Model & Repo**
    - Định nghĩa schema cho workflow, trigger, log, step run.
    - Seed kịch bản mẫu và dữ liệu thử nhanh bằng script.

## Giai đoạn 2 – Workflow Engine cơ bản
1. **Interpreter/State Machine**
    - Thực thi kịch bản JSON: step tuần tự, điều kiện đơn giản.
    - Hỗ trợ retry, lưu trạng thái từng step.
2. **Plugin/Action Layer**
    - Định nghĩa interface plugin + action mẫu (HTTP request, log, delay).
    - Cơ chế nạp plugin động.
3. **Trigger & Scheduler**
    - Nhận sự kiện từ Event Source hoặc cron/timer.
    - Map trigger đến workflow.

## Giai đoạn 3 – Giám sát & Logging
1. **Logging module**
    - Ghi nhật ký workflow run, step run, lỗi.
    - Truy vấn được theo workflow ID hoặc thời gian.
2. **Alert & Retry Queue**
    - Cơ chế retry khi step lỗi.
    - Hook gửi cảnh báo (log đơn giản, sau này email/Slack).

## Giai đoạn 4 – API mở rộng & QA
1. **REST/GraphQL API**
    - Endpoint quản lý workflow, trigger, log.
    - Endpoint test chạy workflow với dữ liệu seed.
2. **Integration Tests**
    - Kiểm thử end-to-end bằng dữ liệu seed: tạo workflow, phát sự kiện, xác nhận hành động.
    - Viết test scripts tối thiểu (Jest/TS).

## Giai đoạn 5 – Frontend & UI (ưu tiên cuối)
1. **Editor UI (React + React Flow + Tailwind)**
    - Kéo-thả node workflow, cấu hình action/điều kiện.
    - Tối thiểu: render diagram từ JSON, chỉnh sửa step.
2. **Dashboard giám sát**
    - Hiển thị log, trạng thái, thống kê cơ bản.
