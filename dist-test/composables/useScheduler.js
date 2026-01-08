import { onBeforeUnmount, ref } from 'vue';
export function useScheduler(config) {
    const tasks = ref([]);
    const intervalId = ref(null);
    let wasRunningOnHide = false;
    const tick = () => {
        const now = config.getTime();
        const windowLimit = now + config.scheduleAheadSec;
        const ready = tasks.value.filter((task) => task.when <= windowLimit);
        tasks.value = tasks.value.filter((task) => task.when > windowLimit);
        ready.forEach((task) => task.callback());
    };
    const start = () => {
        if (intervalId.value !== null)
            return;
        intervalId.value = window.setInterval(tick, config.lookahead);
    };
    const stop = () => {
        if (intervalId.value !== null) {
            clearInterval(intervalId.value);
            intervalId.value = null;
        }
    };
    const schedule = (task) => {
        tasks.value.push(task);
    };
    const clear = () => {
        tasks.value = [];
    };
    if (typeof window !== 'undefined') {
        const handlePageHide = () => {
            if (intervalId.value !== null) {
                wasRunningOnHide = true;
                stop();
            }
            else {
                wasRunningOnHide = false;
            }
        };
        const handlePageShow = () => {
            if (wasRunningOnHide) {
                start();
                tick();
            }
        };
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
        onBeforeUnmount(() => {
            stop();
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('pageshow', handlePageShow);
        });
    }
    else {
        onBeforeUnmount(stop);
    }
    return {
        start,
        stop,
        clear,
        tick,
        schedule
    };
}
//# sourceMappingURL=useScheduler.js.map