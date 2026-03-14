# Video6s²Promo

**六秒一帧，串联成片** —— 上传参考图，一键生成 5 段 6 秒视频并自动合并为 30 秒宣传片。

## 功能概览

- **上传参考图**：支持产品图、场景图等作为生成参考
- **多比例选择**：16:9、9:16、7:4、4:7、1:1 等常见尺寸
- **五段连续生成**：每段 6 秒，基于上一段最后一帧作为下一段参考，保证画面连贯
- **实时进度**：生成过程中可查看当前步骤与已完成的片段
- **自动合并**：5 段生成完成后自动合并为 30 秒成片，支持预览与下载

## 技术栈

| 部分     | 技术 |
|----------|------|
| 前端     | React 18 + TypeScript + Vite |
| 后端     | FastAPI + Python 3 |
| 视频处理 | imageio-ffmpeg（合并）、外部视频生成 API |

## 项目结构

```
Video6s2Promo/
├── frontend/          # 前端应用
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/   # ImageUploader, SizeSelector, ProgressTracker, PreviewPanel
│   │   ├── Icons.tsx
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── backend/           # 后端 API
│   ├── main.py
│   ├── config.py
│   ├── models.py
│   ├── task_manager.py
│   ├── routers/video.py
│   ├── services/      # generator, merger, frame, prompts
│   └── requirements.txt
└── README.md
```

## 快速开始

### 环境要求

- **Node.js** 18+（前端）
- **Python** 3.10+（后端）
- **FFmpeg**（后端合并视频，需在 PATH 中）

### 1. 后端

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env，填写 API_BASE_URL 与 API_KEY（视频生成服务）
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 前端

```bash
cd frontend
pnpm install   # 或 npm install
pnpm dev       # 或 npm run dev
```

浏览器访问：<http://localhost:5173>。前端通过 Vite 代理将 `/api` 转发到后端 `http://localhost:8000`。

### 3. 环境变量

**后端**（`backend/.env`）：

| 变量           | 说明                         | 默认值              |
|----------------|------------------------------|---------------------|
| `API_BASE_URL` | 视频生成 API 基础地址        | `http://localhost:8000` |
| `API_KEY`      | 视频生成服务鉴权 Key         | 空                  |

**前端**（可选，开发时通常用代理无需配置）：

| 变量               | 说明           |
|--------------------|----------------|
| `VITE_BACKEND_URL` | 后端地址，用于代理 target |

## API 说明

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/generate` | 上传 `image`（文件）与 `size`（表单），创建任务，返回 `task_id` |
| `GET`  | `/api/status/{task_id}` | 查询任务状态与进度 |
| `GET`  | `/api/video/{task_id}/merged` | 获取合并后的 30 秒成片 |
| `GET`  | `/api/video/{task_id}/{index}` | 获取第 `index` 段 6 秒视频（1–5） |

## 支持的画面比例

- `1280×720`（16:9）
- `720×1280`（9:16）
- `1792×1024`（7:4）
- `1024×1792`（4:7）
- `1024×1024`（1:1）

## 开发与构建

- **前端**
  - 开发：`pnpm dev`
  - 构建：`pnpm build`
  - 预览构建结果：`pnpm preview`
- **后端**
  - 开发：`uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## 许可证

见项目根目录 LICENSE 文件（如有）。
