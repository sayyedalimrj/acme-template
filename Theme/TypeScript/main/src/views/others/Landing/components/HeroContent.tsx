import Button from '@/components/ui/Button'
import { motion } from 'framer-motion'
import TextGenerateEffect from './TextGenerateEffect'
import { MODE_DARK, MODE_LIGHT } from '@/constants/theme.constant'
import { useNavigate } from 'react-router'
import type { Mode } from '@/@types/theme'

const HeroContent = ({ mode }: { mode: Mode }) => {
    const navigate = useNavigate()

    const handlePreview = () => {
        navigate('/dashboards/ecommerce')
    }

    const handleGetTemplate = () => {
        window.open(
            'https://themeforest.net/item/ecme-the-ultimate-react-tailwind-admin-template/54470284',
            '_blank',
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 flex min-h-screen flex-col items-center justify-between">
            <div className="flex flex-col min-h-screen pt-20 md:pt-40 relative overflow-hidden">
                <div>
                    <TextGenerateEffect
                        wordClassName="text-2xl md:text-4xl lg:text-8xl font-bold max-w-7xl mx-auto text-center mt-6 relative z-10"
                        words="کنترل نهایی را با الگوی کامل باز کنید"
                        wordsCallbackClass={({ word }) => {
                            if (word === 'کامل') {
                                return 'bg-gradient-to-r from-indigo-600 to-[#be598a] bg-clip-text text-transparent'
                            }

                            if (word === 'الگوی') {
                                return 'bg-gradient-to-r from-[#be598a] to-[#ff6a55] bg-clip-text text-transparent'
                            }

                            return ''
                        }}
                    />
                    <motion.p
                        initial={{ opacity: 0, translateY: 40 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        className="text-center mt-6 text-base md:text-xl text-muted dark:text-muted-dark max-w-5xl mx-auto relative z-10 font-normal"
                    >
                        تجربه یک داشبورد مدیریتی و قابل تنظیم را داشته باشید که به نیازهای شما پاسخ می‌دهد. برای
                        توسعه‌دهندگان، توسط توسعه‌دهندگان، برای ساده‌سازی مدیریت جریان کار و بهبود تجربیات کاربر ساخته شده است.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, translateY: 40 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                        className="flex items-center gap-4 justify-center mt-10 relative z-10"
                    >
                        <Button variant="solid" onClick={handlePreview}>
                            پیش‌نمایش
                        </Button>
                        <Button onClick={handleGetTemplate}>
                            این الگو را دریافت کنید
                        </Button>
                    </motion.div>
                </div>
                <div className="p-2 lg:p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-2xl lg:rounded-[32px] mt-20 relative">
                    <div className="absolute inset-x-0 bottom-0 h-40 w-full bg-gradient-to-b from-transparent via-white to-white dark:via-black/50 dark:to-black scale-[1.1] pointer-events-none" />
                    <div className="bg-white dark:bg-black dark:border-gray-700 border border-gray-200 rounded-[24px]">
                        {mode === MODE_LIGHT && (
                            <img
                                className="rounded-2xl lg:rounded-[24px]"
                                src="/img/landing/hero/hero.png"
                                width={1920}
                                height={1040}
                                alt="صفحه اصلی Ecme"
                            />
                        )}
                        {mode === MODE_DARK && (
                            <img
                                className="rounded-2xl lg:rounded-[24px]"
                                src="/img/landing/hero/hero-dark.png"
                                width={1920}
                                height={1040}
                                alt="صفحه اصلی Ecme"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroContent
