# workdir

存放运行过程中的产物与状态。

- `current_run.json`：记录当前任务绑定的 `run_id`
- `runs/<run_id>/workspace/`：该轮各阶段 candidate/approved/evaluation 产物
- `runs/<run_id>/runtime/`：该轮运行状态与日志
