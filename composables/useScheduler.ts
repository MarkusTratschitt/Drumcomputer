import { onBeforeUnmount, ref } from 'vue'

export interface SchedulerConfig {
  lookahead: number
  scheduleAheadSec: number
  getTime: () => number
}

export interface ScheduledTask {
  when: number
  callback: () => void
}

export function useScheduler(config: SchedulerConfig) {
  const tasks = ref<ScheduledTask[]>([])
  const intervalId = ref<number | null>(null)

  const tick = () => {
    const now = config.getTime()
    const windowLimit = now + config.scheduleAheadSec
    const ready = tasks.value.filter((task) => task.when <= windowLimit)
    tasks.value = tasks.value.filter((task) => task.when > windowLimit)
    ready.forEach((task) => task.callback())
  }

  const start = () => {
    if (intervalId.value !== null) return
    intervalId.value = window.setInterval(tick, config.lookahead)
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

  const clear = () => {
    tasks.value = []
  }

  onBeforeUnmount(stop)

  return {
    start,
    stop,
    clear,
    tick,
    schedule
  }
}
