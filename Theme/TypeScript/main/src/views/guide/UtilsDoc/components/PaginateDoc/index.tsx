import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'PaginateDoc/'

const demoHeader = {
    title: 'paginate',
    desc: 'این تابع یک آرایه را بر اساس شماره صفحه و اندازه آن صفحه بندی می‌کند.',
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
                propName: 'آرایه',
                type: `<code>Array&lt;any&gt;</code>`,
                default: `-`,
                desc: 'آرایه‌ای که نیاز به صفحه بندی دارد',
            },
            {
                propName: 'اندازه صفحه',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'حداکثر عنصر آرایه خروجی',
            },
            {
                propName: 'شماره صفحه',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'ایندک که از آرایه شروع می‌شود',
            },
        ],
    },
]

const extra = (
    <DemoComponentApi
        hideApiTitle
        keyText="return"
        api={[
            {
                component: 'بازگشت',
                api: [
                    {
                        propName: 'paginatedData',
                        type: `<code>Array&lt;any&gt;</code>`,
                        default: `-`,
                        desc: 'نتیجه نهایی',
                    },
                ],
            },
        ]}
    />
)

const PaginateDoc = () => {
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
            keyText="param"
        />
    )
}

export default PaginateDoc
