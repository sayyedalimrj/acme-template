import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'IsLastChildDoc'

const demoHeader = {
    title: 'isLastChild',
    desc: 'یک تابع برای تشخیص آخرین ایندکس یک آرایه.',
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
                propName: 'arr',
                type: `<code>Array<any></code>`,
                default: `-`,
                desc: 'آرایه',
            },
            {
                propName: 'index',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'ایندکس فعلی',
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
                        propName: 'lastChild',
                        type: `<code>boolean</code>`,
                        default: `-`,
                        desc: 'آیا ایندکس ورودی آخرین ایندکس آرایه است.',
                    },
                ],
            },
        ]}
    />
)

const IsLastChildDoc = () => {
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

export default IsLastChildDoc
