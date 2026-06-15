import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fa from './lang/fa.json'
import en from './lang/en.json'
import zh from './lang/zh.json'
import es from './lang/es.json'
import ar from './lang/ar.json'
import appConfig from '@/configs/app.config'

const resources = {
    fa: {
        translation: fa,
    },
    en: {
        translation: en,
    },
    zh: {
        translation: zh,
    },
    es: {
        translation: es,
    },
    ar: {
        translation: ar,
    },
}

i18n.use(initReactI18next).init({
    resources,
    fallbackLng: appConfig.locale,
    lng: appConfig.locale,
    interpolation: {
        escapeValue: false,
    },
})

export const dateLocales: {
    [key: string]: () => Promise<ILocale>
} = {
    fa: () => import('dayjs/locale/fa'),
    en: () => import('dayjs/locale/en'),
    es: () => import('dayjs/locale/es'),
    zh: () => import('dayjs/locale/zh'),
    ar: () => import('dayjs/locale/ar'),
}

export default i18n
