import Container from './LandingContainer'
import RegionMap from '@/components/shared/RegionMap'
import { TbCircleCheck } from 'react-icons/tb'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const mapMeta: Record<string, { img: string }> = {
    us: { img: '/img/countries/US.png' },
    cn: { img: '/img/countries/CN.png' },
    es: { img: '/img/countries/ES.png' },
    sa: { img: '/img/countries/SA.png' },
}

const data = [
    {
        id: 'us',
        name: 'United States',
        value: 38.61,
        coordinates: [-95.7129, 37.0902],
    },
    {
        id: 'es',
        name: 'India',
        value: 26.42,
        coordinates: [-51.9253, -14.235],
    },
    {
        id: 'cn',
        name: 'Brazil',
        value: 32.79,
        coordinates: [78.9629, 20.5937],
    },
    {
        id: 'sa',
        name: 'United Kingdom',
        value: 17.42,
        coordinates: [0.1278, 51.5074],
    },
]

const PointList = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex items-center gap-2">
            <TbCircleCheck className="text-xl" />
            <span>{children}</span>
        </div>
    )
}

const OtherFeatures = () => {
    return (
        <div id="otherFeatures" className="relative z-20 py-10 md:py-40">
            <Container>
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
                    viewport={{ once: true }}
                >
                    <motion.h2 className="my-6 text-5xl">
                        برای هر نیاز سفارشی شده است
                    </motion.h2>
                    <motion.p className="mx-auto max-w-[600px]">
                        برای تطابق با هر کاربر یا منطقه طراحی شده است، عملکرد یکپارچه را در تمام دستگاه‌ها و زبان‌ها ارائه می‌دهد.
                    </motion.p>
                </motion.div>
                <div className="mt-20">
                    <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-3xl py-12 px-10 lg:py-24 lg:px-16 overflow-hidden mb-10"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            type: 'spring',
                            bounce: 0.1,
                        }}
                        viewport={{ once: true }}
                    >
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4">
                            <div>
                                <h3 className="text-4xl">طراحی پاسخگو</h3>
                                <p className="mt-6 max-w-[550px] text-lg">
                                    اپلیکیشن شما در همه دستگاه‌ها، از دسکتاپ‌ها تا تبلت‌ها و تلفن‌های همراه، ظاهر زیبایی خواهد داشت.
                                    هیچ نگرانی در مورد مقیاس‌بندی نیست—برای کارکرد بدون نقص در هر اندازه صفحه طراحی شده است.
                                </p>
                                <div className="mt-12 flex flex-col gap-4">
                                    <PointList>
                                        طرح‌بندی‌ها را برای رزولوشن‌های صفحه نمایش مختلف خودکار تنظیم می‌کند.
                                    </PointList>
                                    <PointList>
                                        کوئری‌های رسانه‌ای بهینه‌شده برای عملکرد در دستگاه‌های کوچکتر.
                                    </PointList>
                                    <PointList>
                                        انتقال‌ها و طراحی روان برای تعاملات لمسی.
                                    </PointList>
                                </div>
                            </div>
                            <div className="relative flex justify-center">
                                <motion.div
                                    className="p-2 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-[32px] max-w-[300px] lg:absolute lg:top-[-50px]"
                                    whileHover={{ y: -20 }}
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-20 w-full bg-gradient-to-b from-transparent via-gray-100 to-gray-100 dark:via-zinc-800/70 dark:to-gray-800 scale-[1.1] pointer-events-none" />
                                    <div className="bg-white dark:bg-black dark:border-gray-700 border border-gray-200 rounded-[24px] overflow-hidden max-h-[450px]">
                                        <img
                                            src="/img/landing/features/mobile.png"
                                            alt="نمای موبایل"
                                            className="rounded-[24px]"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-3xl py-12 px-10 lg:py-24 lg:px-16 overflow-hidden mb-10"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            type: 'spring',
                            bounce: 0.1,
                        }}
                        viewport={{ once: true }}
                    >
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4">
                            <div className="relative flex justify-center">
                                <div className="lg:absolute h-full w-full left-0 md:left-[-50px] scale-[1.1]">
                                    <RegionMap
                                        data={data}
                                        valueSuffix="%"
                                        hoverable={false}
                                        marker={(Marker) => (
                                            <>
                                                {data.map(
                                                    ({
                                                        name,
                                                        coordinates,
                                                        id,
                                                    }) => (
                                                        <Marker
                                                            key={name}
                                                            coordinates={
                                                                coordinates as [
                                                                    number,
                                                                    number,
                                                                ]
                                                            }
                                                            className="cursor-pointer group"
                                                        >
                                                            <motion.image
                                                                className="shadow-lg"
                                                                href={
                                                                    mapMeta[id]
                                                                        .img
                                                                }
                                                                height="80"
                                                                width="80"
                                                                whileHover={{
                                                                    scale: 1.1,
                                                                }}
                                                            />
                                                        </Marker>
                                                    ),
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-4xl">
                                    پشتیبانی چند زبانه
                                </h3>
                                <p className="mt-6 max-w-[550px] text-lg">
                                    با پشتیبانی چند زبانه داخلی، دسترسی خود را گسترش دهید. به سادگی بین زبان‌ها جابه‌جا شوید و تجربه صاف را برای کاربران در سراسر جهان تضمین کنید.
                                </p>
                                <div className="mt-12 flex flex-col gap-4">
                                    <PointList>
                                        جابه‌جایی سریع و آسان زبان از طریق کشویی.
                                    </PointList>
                                    <PointList>
                                        پشتیبانی از همه زبان‌های اصلی و امکان گسترش آسان به زبان‌های جدید.
                                    </PointList>
                                    <PointList>
                                        یکپارچه با <code>react-i18next</code> برای ترجمه‌های صاف.
                                    </PointList>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div className="bg-gray-100 dark:bg-gray-800 rounded-3xl py-12 px-10 lg:py-24 lg:px-16 overflow-hidden mb-10">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4">
                            <div>
                                <h3 className="text-4xl">آماده برای چیدمان RTL</h3>
                                <p className="mt-6 max-w-[550px] text-lg">
                                    چه کاربران شما در مناطق راست به چپ باشند یا چپ به راست، گزینه‌های چیدمان ما شما را پوشش می‌دهند. به سادگی برای زبان‌هایی مانند عربی یا عبری به چیدمان RTL تغییر دهید.
                                </p>
                                <div className="mt-12 flex flex-col gap-4">
                                    <PointList>
                                        تبدیل فوری RTL با تغییر یک تنظیم.
                                    </PointList>
                                    <PointList>
                                        کاملاً برای یکپارچگی بصری و خوانایی تست شده است.
                                    </PointList>
                                    <PointList>
                                        در تمام کامپوننت‌ها کار می‌کند، تضمین تجربه کاربر یکپارچه.
                                    </PointList>
                                </div>
                            </div>
                            <div className="relative flex justify-center">
                                <motion.div
                                    whileHover={{ y: -20 }}
                                    className="relative flex justify-center w-full"
                                >
                                    <div className="p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-[32px] max-w-[550px] lg:absolute ">
                                        <div className="absolute inset-x-0 bottom-0 h-20 w-full bg-gradient-to-b from-transparent via-gray-100 to-gray-100 dark:via-zinc-800/50 dark:to-gray-800 scale-[1.1] pointer-events-none" />
                                        <div className="bg-white dark:border-gray-700 border border-gray-200 rounded-[24px] overflow-hidden p-2">
                                            <img
                                                src="/img/landing/features/rtl.png"
                                                alt="نمای اپلیکیشن"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Container>
        </div>
    )
}

export default OtherFeatures
