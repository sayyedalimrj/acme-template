import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'AcronymDoc'

const demoHeader = {
    title: 'acronym',
    desc: 'تابع برای دریافت اختصار از یک رشته نام.',
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
                propName: 'name',
                type: `<code>string</code>`,
                default: `<code>''</code>`,
                desc: 'رشته نام',
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
                        propName: 'acronym',
                        type: `<code>string</code>`,
                        default: `-`,
                        desc: 'اختصار',
                    },
                ],
            },
        ]}
    />
)

const AcronymDoc = () => {
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
            keyText="param"
        />
    )
}

export default AcronymDoc
