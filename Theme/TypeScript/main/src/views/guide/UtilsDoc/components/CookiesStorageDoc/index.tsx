import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'CookiesStorageDoc'

const demoHeader = {
    title: 'cookiesStorage',
    desc: 'یک تابع ابزاری که رابطی برای ذخیره، بازیابی و حذف موارد از کوکی‌ها فراهم می‌کند.',
}

const demos = [
    {
        mdName: 'Example',
        mdPath: mdPath,
        title: 'مثال',
        desc: ``,
        component: <Example />,
    },
]

const demoApi = [
    {
        component: 'cookiesStorage',
        api: [
            {
                propName: 'getItem',
                type: `<code>(name: string) => string | null</code>`,
                default: '-',
                desc: 'مقدار یک کوکی را بازیابی می‌کند یا اگر کوکی وجود نداشته باشد، null را برمی‌گرداند.',
            },
            {
                propName: 'setItem',
                type: `<code>(name: string, value: string, expires?: number | Date) => void</code>`,
                default: '-',
                desc: 'یک کوکی با نام، مقدار و تاریخ انقضای ارائه شده تنظیم می‌کند.',
            },
            {
                propName: 'removeItem',
                type: `<code>(name: string) => void</code>`,
                default: '-',
                desc: 'یک کوکی را با نام آن حذف می‌کند.',
            },
        ],
    },
]

const CookiesStorageDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            api={demoApi}
            mdPrefixPath="utils"
        />
    )
}

export default CookiesStorageDoc
