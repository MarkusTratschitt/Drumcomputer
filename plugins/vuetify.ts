import { createVuetify, DateInstance, DefaultsInstance, DisplayInstance, GoToInstance, IconAliases, IconSet, LocaleInstance, LocaleMessages, LocaleOptions, ThemeInstance } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { defineNuxtPlugin } from 'nuxt/app'
import { App, Ref, ShallowRef } from 'vue'

export default defineNuxtPlugin((nuxtApp: { vueApp: { use: (arg0: { install: (app: App<unknown>) => void; unmount: () => void; defaults: Ref<DefaultsInstance, DefaultsInstance>; display: DisplayInstance; theme: ThemeInstance & { install: (app: App<unknown>) => void }; icons: { defaultSet: string; aliases: Partial<IconAliases>; sets: Record<string, IconSet> }; locale: { name: string; decimalSeparator: ShallowRef<string>; messages: Ref<LocaleMessages, LocaleMessages>; current: Ref<string, string>; fallback: Ref<string, string>; t: (key: string, ...params: unknown[]) => string; n: (value: number) => string; provide: (props: LocaleOptions) => LocaleInstance; isRtl: Ref<boolean, boolean>; rtl: Ref<Record<string, boolean>, Record<string, boolean>>; rtlClasses: Ref<string, string> }; date: { options: { adapter: (new (options: { locale: unknown; formats?: unknown }) => DateInstance) | DateInstance; formats?: Record<string, unknown>; locale: Record<string, unknown> }; instance: { date: (value?: unknown) => unknown; format: (date: unknown, formatString: string) => string; toJsDate: (value: unknown) => Date; parseISO: (date: string) => unknown; toISO: (date: unknown) => string; startOfDay: (date: unknown) => unknown; endOfDay: (date: unknown) => unknown; startOfWeek: (date: unknown, firstDayOfWeek?: string | number | undefined) => unknown; endOfWeek: (date: unknown) => unknown; startOfMonth: (date: unknown) => unknown; endOfMonth: (date: unknown) => unknown; startOfYear: (date: unknown) => unknown; endOfYear: (date: unknown) => unknown; isAfter: (date: unknown, comparing: unknown) => boolean; isAfterDay: (date: unknown, comparing: unknown) => boolean; isSameDay: (date: unknown, comparing: unknown) => boolean; isSameMonth: (date: unknown, comparing: unknown) => boolean; isSameYear: (date: unknown, comparing: unknown) => boolean; isBefore: (date: unknown, comparing: unknown) => boolean; isEqual: (date: unknown, comparing: unknown) => boolean; isValid: (date: unknown) => boolean; isWithinRange: (date: unknown, range: [unknown, unknown]) => boolean; addMinutes: (date: unknown, amount: number) => unknown; addHours: (date: unknown, amount: number) => unknown; addDays: (date: unknown, amount: number) => unknown; addWeeks: (date: unknown, amount: number) => unknown; addMonths: (date: unknown, amount: number) => unknown; getYear: (date: unknown) => number; setYear: (date: unknown, year: number) => unknown; getDiff: (date: unknown, comparing: unknown, unit?: string | undefined) => number; getWeekArray: (date: unknown, firstDayOfWeek?: string | number | undefined) => unknown[][]; getWeekdays: (firstDayOfWeek?: string | number | undefined, weekdayFormat?: "long" | "narrow" | "short" | undefined) => string[]; getWeek: (date: unknown, firstDayOfWeek?: string | number | undefined, firstDayOfYear?: string | number | undefined) => number; getMonth: (date: unknown) => number; setMonth: (date: unknown, month: number) => unknown; getDate: (date: unknown) => number; setDate: (date: unknown, day: number) => unknown; getNextMonth: (date: unknown) => unknown; getPreviousMonth: (date: unknown) => unknown; getHours: (date: unknown) => number; setHours: (date: unknown, hours: number) => unknown; getMinutes: (date: unknown) => number; setMinutes: (date: unknown, minutes: number) => unknown; locale?: unknown } }; goTo: GoToInstance }) => void } }) => {
  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi }
    },
    theme: {
      defaultTheme: 'dark'
    }
  })

  nuxtApp.vueApp.use(vuetify)
})

