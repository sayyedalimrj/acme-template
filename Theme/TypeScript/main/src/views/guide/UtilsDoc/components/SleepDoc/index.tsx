import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'SleepDoc'

const demoHeader = {
    title: 'sleep',
    desc: 'عملکردی که تأخیری در اجرای کد ایجاد می‌کند یا آن را برای مدت زمان مشخصی متوقف می‌کند و با بازگشت یک پرومیس که پس از زمان داده شده حل می‌شود، انجام می‌شود.',
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
        component: 'پارامترها',
        api: [
            {
                propName: 'ms',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'تعداد میلی‌ثانیه‌ها برای توقف اجرای کد.',
            },
        ],
    },
]

const extra = (
    <DemoComponentApi
        hideApiTitle
        keyText="بازگشت"
        api={[
            {
                component: 'بازگشت',
                api: [
                    {
                        propName: 'resolve',
                        type: `<code>Promise<void></code>`,
                        default: `-`,
                        desc: 'پرومیس پس از تأخیر حل می‌شود و اجازه می‌دهد تا عملیات بعدی اجرا شود.',
                    },
                ],
            },
        ]}
    />
)

const SleepDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            api={demoApi}
            mdPrefixPath="utils"
            extra={extra}
            keyText="پارامتر"
        />
    )
}

export default SleepDoc
