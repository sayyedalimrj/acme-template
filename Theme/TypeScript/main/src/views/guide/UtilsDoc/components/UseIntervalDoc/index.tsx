import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'
// Demo
import Example from './Example'

const mdPath = 'UseIntervalDoc/'

const demoHeader = {
    title: 'useInterval',
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
                propName: 'callback',
                type: `<code>() => void</code>`,
                default: `-`,
                desc: 'تابعی که باید در هر بازه زمانی اجرا شود.',
            },
            {
                propName: 'delay',
                type: `<code>number | null</code>`,
                default: `-`,
                desc: 'تأخیر بین هر اجرای callback به میلی‌ثانیه. اگر null باشد، بازه متوقف می‌شود.',
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
                        propName: 'intervalRef',
                        type: `<code>React.MutableRefObject<number | null></code>`,
                        default: `-`,
                        desc: 'یک شیء ref که شناسه بازه را نگه می‌دارد و می‌توان از آن برای مدیریت دستی بازه استفاده کرد.',
                    },
                ],
            },
        ]}
    />
)

const UseIntervalDoc = () => {
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

export default UseIntervalDoc
