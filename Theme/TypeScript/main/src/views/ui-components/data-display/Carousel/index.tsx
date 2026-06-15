'use client'

import DemoLayout from '@/components/docs/DemoLayout'

import Basic from './Basic'
import Vertical from './Vertical'
import WithApi from './WithApi'
import Sizes from './Sizes'
import Positioning from './Positioning'

const mdPath = 'Carousel'

const demoHeader = {
    title: 'چرخ فلک (Carousel)',
    desc: 'یک چرخ فلک با انیمیشن و قابلیت کشیدن که بدون وابستگی‌های خارجی ساخته شده است.',
}

const demos = [
    {
        mdName: 'Basic',
        mdPath: mdPath,
        title: 'پایه (Basic)',
        desc: `استفاده پایه از چرخ فلک با دکمه‌های ناوبری.`,
        component: <Basic />,
    },
    {
        mdName: 'Vertical',
        mdPath: mdPath,
        title: 'عمودی (Vertical)',
        desc: `تنظیم <code>orientation="vertical"</code> برای نمایش چرخ فلک عمودی.`,
        component: <Vertical />,
    },
    {
        mdName: 'WithApi',
        mdPath: mdPath,
        title: 'با API',
        desc: `از ویژگی <code>setApi</code> برای دسترسی به API چرخ فلک و کنترل برنامه‌نویسی استفاده کنید.`,
        component: <WithApi />,
    },
    {
        mdName: 'Sizes',
        mdPath: mdPath,
        title: 'اندازه‌ها (Sizes)',
        desc: `سفارشی‌سازی اندازه آیتم‌ها با استفاده از کلاس‌های <code>basis-*</code> در CarouselItem.`,
        component: <Sizes />,
    },
    {
        mdName: 'Positioning',
        mdPath: mdPath,
        title: 'موقعیت دکمه‌ها (Button Positioning)',
        desc: `کنترل موقعیت دکمه‌های ناوبری با کلاس‌های CSS سفارشی. دکمه‌ها دیگر موقعیت از پیش تعریف شده ندارند.`,
        component: <Positioning />,
    },
]

const demoApi = [
    {
        component: 'Carousel (چرخ فلک)',
        api: [
            {
                propName: 'orientation',
                type: `<code>'horizontal' | 'vertical'</code>`,
                default: `<code>'horizontal'</code>`,
                desc: 'جهت چرخ فلک (افقی یا عمودی)',
            },
            {
                propName: 'opts',
                type: `<code>{ startIndex?: number }</code>`,
                default: `<code>{}</code>`,
                desc: 'تنظیمات چرخ فلک',
            },
            {
                propName: 'setApi',
                type: `<code>(api: CarouselApi) => void</code>`,
                default: `-`,
                desc: 'فراخوانی برای دریافت API چرخ فلک',
            },
        ],
    },
    {
        component: 'Carousel.Content (محتوای چرخ فلک)',
        api: [
            {
                propName: 'className',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'کلاس‌های CSS اضافی برای کانتینر محتوا',
            },
        ],
    },
    {
        component: 'Carousel.Item (آیتم چرخ فلک)',
        api: [
            {
                propName: 'className',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'کلاس‌های CSS اضافی برای آیتم (برای اندازه از basis-* استفاده کنید)',
            },
        ],
    },
    {
        component: 'Carousel.Previous / Carousel.Next (دکمه قبلی/بعدی)',
        api: [
            {
                propName: 'className',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'کلاس‌های CSS برای موقعیت و استایل (موقعیت از پیش تعریف شده ندارد)',
            },
            {
                propName: 'variant',
                type: `<code>'solid' | 'subtle' | 'default' | 'ghost' | 'link'</code>`,
                default: `<code>'default'</code>`,
                desc: 'استایل نوع دکمه',
            },
            {
                propName: 'size',
                type: `<code>'sm' | 'md' | 'lg'</code>`,
                default: `<code>'sm'</code>`,
                desc: 'اندازه دکمه',
            },
        ],
    },
]

const CarouselDemo = () => {
    return <DemoLayout header={demoHeader} demos={demos} api={demoApi} />
}

export default CarouselDemo