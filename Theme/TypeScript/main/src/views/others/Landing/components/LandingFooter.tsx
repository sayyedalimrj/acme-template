import Container from './LandingContainer'
import Button from '@/components/ui/Button'
import AuroraBackground from './AuroraBackground'
import { motion } from 'framer-motion'
import { MODE_DARK, MODE_LIGHT } from '@/constants/theme.constant'
import { useNavigate } from 'react-router'
import type { Mode } from '@/@types/theme'

const LandingFooter = ({ mode }: { mode: Mode }) => {
    const year = new Date().getFullYear()

    const navigate = useNavigate()

    const handlePreview = () => {
        navigate('/dashboards/ecommerce')
    }

    return (
        <div id="footer" className="relative z-20">
            <Container className="relative">
                <div className="py-10 md:py-40">
                    <AuroraBackground
                        className="rounded-3xl"
                        auroraClassName="rounded-3xl"
                    >
                        <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.3,
                                duration: 0.3,
                                ease: 'easeInOut',
                            }}
                            className="relative flex flex-col gap-4 items-center justify-center py-20 px-8 text-center"
                        >
                            <h2 className="text-5xl">آماده شروع شدن هستید؟</h2>
                            <p className="mt-4 max-w-[400px] mx-auto">
                                اپلیکیشن‌های مدرن و مقیاس‌پذیر را به آسانی با Ecme بسازید.
                                پروژه خود را امروز به سطح بعدی برسانید!
                            </p>
                            <div className="mt-6">
                                <Button variant="solid" onClick={handlePreview}>
                                    اکنون شروع کنید
                                </Button>
                            </div>
                        </motion.div>
                    </AuroraBackground>
                </div>
                <div className="py-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                        <a href="/">
                            {mode === MODE_LIGHT && (
                                <img
                                    src="/img/logo/logo-light-full.png"
                                    width={120}
                                    height={40}
                                    alt="لوگو"
                                />
                            )}
                            {mode === MODE_DARK && (
                                <img
                                    src="/img/logo/logo-dark-full.png"
                                    width={120}
                                    height={40}
                                    alt="لوگو"
                                />
                            )}
                        </a>
                        <p className="text-center">
                            کپی رایت © {year} Theme_Nate. همه حقوق محفوظ است.
                        </p>
                    </div>
                </div>
            </Container>
        </div>
    )
}

export default LandingFooter
