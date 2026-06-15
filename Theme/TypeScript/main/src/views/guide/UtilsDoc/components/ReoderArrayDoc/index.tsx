import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'ReoderArrayDoc'

const demoHeader = {
    title: 'reoderArray',
    desc: '<p><code>reorderArray</code> تابعی است که یک آرایه را می‌گیرد و عناصر آن را با جابجایی یک مورد از یک ایندکس به ایندکس دیگر، دوباره مرتب می‌کند.</p>',
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
                propName: 'list',
                type: `<code>T[]</code>`,
                default: `-`,
                desc: 'آرایه‌ای که باید دوباره مرتب شود. این می‌تواند آرایه‌ای از هر نوع باشد (T یک نوع عمومی است).',
            },
            {
                propName: 'startIndex',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'ایندکس عنصری در آرایه که می‌خواهید جابجا کنید.',
            },
            {
                propName: 'endIndex',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'ایندکس هدفی که عنصر باید در آن قرار گیرد.',
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
                        propName: 'result',
                        type: `<code>T[]</code>`,
                        desc: 'یک آرایه جدید با عنصر دوباره مرتب شده از startIndex به endIndex.',
                        default: `-`,
                    },
                ],
            },
        ]}
    />
)

const ReoderArrayDoc = () => {
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

export default ReoderArrayDoc
