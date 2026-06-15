import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'WildCardSearchDoc'

const demoHeader = {
    title: 'wildCardSearch',
    desc: 'جستجوی الگو برای آرایه‌ای از اشیاء.',
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
                type: `<code>Array&lt;T&gt;</code>`,
                default: `-`,
                desc: 'آرایه‌ای از اشیاء',
            },
            {
                propName: 'input',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'کلمه کلیدی',
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
                        type: `<code>Array&lt;T&gt;</code>`,
                        default: `-`,
                        desc: 'آرایه نتیجه',
                    },
                ],
            },
        ]}
    />
)

const WildCardSearchDoc = () => {
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

export default WildCardSearchDoc
