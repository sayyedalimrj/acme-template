import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'WithHeaderItemDoc'

const demoHeader = {
    title: 'withHeaderItem',
    desc: 'کامپوننت withHeaderItem را به یک گزینه قابل کلیک برای هدر تبدیل می‌کند.',
}

const demos = [
    {
        mdName: 'Example',
        mdPath: mdPath,
        title: 'Example',
        desc: `استفاده از مثال.`,
        component: <Example />,
    },
]

const demoApi = [
    {
        component: 'withHeaderItem',
        api: [
            {
                propName: 'hoverable',
                type: `<code>boolean</code>`,
                default: `<code>true</code>`,
                desc: 'آیا باید آیتم قابل هاور باشد',
            },
        ],
    },
]

const WithHeaderItemDoc = () => {
    return (
        <DemoLayout
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            api={demoApi}
            mdPrefixPath="utils"
        />
    )
}

export default WithHeaderItemDoc
