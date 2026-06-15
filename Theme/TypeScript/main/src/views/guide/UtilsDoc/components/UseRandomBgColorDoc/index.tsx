import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseRandomBgColorDoc'

const demoHeader = {
    title: 'useRandomBgColor',
    desc: 'هوک useRandomBgColor یک رنگ پس‌زمینه تصادفی از یک لیست سفید از رنگ‌های Tailwind CSS بر اساس نام ورودی تولید می‌کند. این هوک برای اختصاص رنگ‌های پس‌زمینه سازگار بر اساس یک رشته، مانند نام کاربری یا نام آیتم، مفید است.',
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

const extra = (
    <DemoComponentApi
        hideApiTitle
        keyText="بازگشت"
        api={[
            {
                api: [
                    {
                        propName: 'generateBgColor',
                        type: `<code>(name: string) => string</code>`,
                        default: '',
                        desc: 'کلاسی از رنگ پس‌زمینه Tailwind CSS را بر اساس رشته نام ورودی برمی‌گرداند.',
                    },
                ],
            },
        ]}
    />
)

const UseRandomBgColorDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            mdPrefixPath="utils"
            extra={extra}
            keyText="پارامتر"
        />
    )
}

export default UseRandomBgColorDoc
