import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'
// Demo
import Example from './Example'

const mdPath = 'UseDebounceDoc/'

const demoHeader = {
    title: 'useDebounce ',
    desc: 'این هوک راهی آسان برای تأخیر در هر تابع را فراهم می‌کند و اطمینان می‌دهد که تنها پس از یک تأخیر مشخص اجرا می‌شود.',
}

const demos = [
    {
        mdName: 'مثال',
        mdPath: mdPath,
        title: 'مثال',
        desc: ``,
        component: <Example />,
    },
]

const demoApi = [
    {
        component: 'پارامترها',
        api: [
            {
                propName: 'func',
                type: `<code> (...args: any)</code>`,
                default: `-`,
                desc: 'تابعی که باید تأخیر داشته باشد.',
            },
            {
                propName: 'wait',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'تعداد میلی‌ثانیه‌ها برای تأخیر. اگر ارائه نشود، تابع با تأخیر پیش‌فرض (معمولاً تعیین‌شده توسط lodash) تأخیر خواهد داشت.',
            },
        ],
    },
]

const extra = (
    <DemoComponentApi
        keyText="بازگشت"
        api={[
            {
                component: 'بازگشت',
                api: [
                    {
                        propName: 'func',
                        type: `<code> (...args: any)</code>`,
                        default: `-`,
                        desc: 'نسخه‌ای تأخیر یافته از تابع ارائه‌شده، که اجرای آن بر اساس زمان تأخیر مشخص‌شده و گزینه‌ها تأخیر خواهد داشت.',
                    },
                ],
            },
        ]}
    />
)

const UseDebounceDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            mdPrefixPath="docs/SharedComponentsDoc/components"
            api={demoApi}
            extra={extra}
            keyText="پارامتر"
        />
    )
}

export default UseDebounceDoc
