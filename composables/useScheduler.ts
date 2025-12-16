import { onBeforeUnmount, ref } from 'vue'

export interface SchedulerConfig {
  lookaheadMs: number
  scheduleAheadTime: number
}

export interface ScheduledTask {
  time: number
  callback: () => void
}

export function useScheduler(config: SchedulerConfig) {
  const tasks = ref<ScheduledTask[]>([])
  const intervalId = ref<number | null>(null)

  const tick = () => {
    const now = performance.now() / 1000
    const windowLimit = now + config.scheduleAheadTime
    const ready = tasks.value.filter((task) => task.time <= windowLimit)
    tasks.value = tasks.value.filter((task) => task.time > windowLimit)
    ready.forEach((task) => task.callback())
  }

  const start = () => {
    if (intervalId.value !== null) return
    intervalId.value = window.setInterval(tick, config.lookaheadMs)
  }

  const stop = () => {
    if (intervalId.value !== null) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  const schedule = (task: ScheduledTask) => {
    tasks.value.push(task)
  }

  onBeforeUnmount(stop)

  return {
    start,
    stop,
    schedule
  }
}
