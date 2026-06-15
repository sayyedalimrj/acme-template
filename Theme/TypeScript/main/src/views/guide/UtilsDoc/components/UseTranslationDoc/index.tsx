import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseTranslationDoc'

const demoHeader = {
    title: 'useTranslation',
    desc: `<code>useTranslation</code> یک wrapper سفارشی برای <code>react-i18next</code> است که از <code>useTranslation</code> استفاده می‌کند.`,
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
                propName: 'usePlaceholder',
                type: `<code>boolean</code>	`,
                default: '-',
                desc: 'پرچم نشان‌دهنده اینکه آیا باید از یک تابع ترجمه placeholder استفاده شود.',
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
                api: [
                    {
                        propName: 't',
                        type: `<code>(key: string, fallback?: string | Record< string, string | number >) => string</code>`,
                        default: '-',
                        desc: 'یک تابع ترجمه که رشته ترجمه شده یا fallback را در صورت عدم وجود ترجمه برمی‌گرداند.',
                    },
                    {
                        propName: 'ready',
                        type: `<code>boolean</code>`,
                        default: '-',
                        desc: 'نشان می‌دهد که آیا ترجمه‌ها آماده استفاده هستند.',
                    },
                    {
                        propName: 'i18n',
                        type: `<code>string</code>`,
                        default: '-',
                        desc: 'نمونه i18n یا یک رشته خالی در حالت placeholder.',
                    },
                ],
            },
        ]}
    />
)

const UseTranslationDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            mdPrefixPath="utils"
            extra={extra}
            api={demoApi}
            keyText="param"
        />
    )
}

export default UseTranslationDoc
