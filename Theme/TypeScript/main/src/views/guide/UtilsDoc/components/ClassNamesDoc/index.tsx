import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'ClassNamesDoc'

const demoHeader = {
    title: 'classNames',
    desc: 'تابع ابزاری که چندین نام کلاس را با استفاده از کتابخانه <code>classnames</code> ترکیب می‌کند و تضادهای کلاس Tailwind CSS را با استفاده از ابزار <code>tailwind-merge</code> ادغام می‌کند.',
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
                type: `<code>cn.ArgumentArray</code>`,
                default: `-`,
                desc: 'لیستی با طول متغیر از نام‌های کلاس یا شرایطی که به نام‌های کلاس تبدیل می‌شوند.',
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
                        propName: 'classNames',
                        type: `<code>string</code>`,
                        default: `-`,
                        desc: 'نام‌های کلاس',
                    },
                ],
            },
        ]}
    />
)

const ClassNamesDoc = () => {
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

export default ClassNamesDoc
