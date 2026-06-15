import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'SortByDoc/'

const demoHeader = {
    title: 'sortBy',
    desc: 'تابع <code>sortBy</code> قادر است آرایه‌ای از اشیاء را بر اساس کلید با استفاده از تابع مقایسه <code>array.sort</code> مرتب کند.',
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
                propName: 'field',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'کلید شیء که هدف مرتب‌سازی است',
            },
            {
                propName: 'reverse',
                type: `<code>boolean</code>`,
                default: `-`,
                desc: 'ترتیب نتیجه، <code>true</code> برای نزولی، <code>false</code> برای صعودی',
            },
            {
                propName: 'primer',
                type: `<code>(key: string) => (key) => void</code>`,
                default: `-`,
                desc: 'بسته بازگشتی برای کلید',
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
                        type: `<code>(a, b) => boolean</code>`,
                        default: `-`,
                        desc: 'تابع بازگشتی مرتب‌سازی',
                    },
                ],
            },
        ]}
    />
)

const SortByDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            api={demoApi}
            mdPrefixPath="docs/SharedComponentsDoc/components"
            extra={extra}
            keyText="پارامتر"
        />
    )
}

export default SortByDoc
