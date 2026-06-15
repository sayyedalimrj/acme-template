import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'FileSizeUnitDoc'

const demoHeader = {
    title: 'fileSizeUnit',
    desc: '<p><code>fileSizeUnit</code> تابعی است که اندازه فایل (به بایت) را به یک رشته قابل خواندن برای انسان با واحدهای مناسب (kB، MB و غیره) فرمت می‌کند.</p>',
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
                propName: 'bytes',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'اندازه فایل به بایت.',
            },
            {
                propName: 'si',
                type: `<code>boolean</code>`,
                default: `-`,
                desc: 'تعیین می‌کند که آیا باید از واحدهای SI (پایه 1000) یا واحدهای باینری (پایه 1024) استفاده شود.',
            },
            {
                propName: 'dp',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'تعداد ارقام اعشاری که باید در خروجی فرمت شده گنجانده شود.',
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
                component: 'پارامترها',
                api: [
                    {
                        propName: 'result',
                        type: `<code>string</code>`,
                        desc: 'اندازه فایل فرمت شده با واحد مناسب، بر اساس تعداد بایت.',
                        default: `-`,
                    },
                ],
            },
        ]}
    />
)

const FileSizeUnitDoc = () => {
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

export default FileSizeUnitDoc
