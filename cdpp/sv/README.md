# Máy chủ workflow CDPP

## Tổng quan
Dự án cung cấp máy chủ backend viết bằng Node.js và TypeScript cho hệ thống workflow CDPP.

## Tính năng (bao gồm cả kế hoạch tương lai)
- [ ] Event Source service: phát hiện thao tác dữ liệu và ghi log sự kiện.
- [ ] Workflow Engine: thực thi kịch bản JSON với step tuần tự và điều kiện.
- [ ] Plugin/Action layer: định nghĩa interface cho plugin và action như HTTP request, log, delay.
- [ ] Trigger & Scheduler: nhận sự kiện từ event source hoặc cron để kích hoạt workflow.
- [ ] Logging & giám sát: lưu trạng thái từng bước, hỗ trợ retry và cảnh báo.
- [ ] REST/GraphQL API: quản lý workflow, trigger, log và thử nghiệm.
- [ ] Frontend & UI: giao diện kéo-thả workflow và dashboard giám sát.

## Yêu cầu hệ thống
- Node.js >= 18
- npm

## Cài đặt
```bash
npm install
```

## Các lệnh chạy
- `npm run sv:start` – chạy server ở chế độ phát triển (tsx watch).
- `npm run sv:type-check` – kiểm tra kiểu TypeScript.
- `npm run sv:build` – build mã nguồn sang JavaScript.
- `npm run sv:prod` – chạy bản build.
- `npm run sv:seed` – seed dữ liệu mẫu.
- `npm run sv:seed:fresh` – seed lại dữ liệu từ đầu.

