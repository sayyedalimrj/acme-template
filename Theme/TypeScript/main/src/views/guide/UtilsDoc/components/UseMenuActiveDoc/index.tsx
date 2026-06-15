import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseMenuActiveDoc'

const demoHeader = {
    title: 'useMenuActive',
    desc: 'هوک useMenuActive به دریافت متا ناوبری مرتبط با مسیر فعلی کمک می‌کند.',
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
                propName: 'navTree',
                type: `<code>NavConfigMeta[]</code>`,
                default: `-`,
                desc: 'درخت پیکربندی ناوبری',
            },
            {
                propName: 'key',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'کلید مسیر فعلی',
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
                        propName: 'activedRoute',
                        type: `<code>NavConfigMeta</code>`,
                        default: `-`,
                        desc: 'NavConfigMeta که با کلید مسیر فعلی جفت شده است',
                    },
                    {
                        propName: 'includedRouteTree',
                        type: `<code>NavConfigMeta</code>`,
                        default: `-`,
                        desc: 'درخت NavConfigMeta ریشه که شامل کلید مسیر فعلی است',
                    },
                ],
            },
        ]}
    />
)

const UseMenuActiveDoc = () => {
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

export default UseMenuActiveDoc
