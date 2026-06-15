import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseResponsiveDoc'

const demoHeader = {
    title: 'useResponsive',
    desc: 'یک هوک برای دریافت اطلاعات واکنش‌گرا',
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
                        propName: 'larger',
                        type: `<code>{2xl: boolean, xl: boolean, lg: boolean, md: boolean, sm: boolean, xs: boolean}</code>`,
                        default: `-`,
                        desc: 'نقاط شکست با بیانیه‌ای که بزرگتر از عرض فعلی پنجره است',
                    },
                    {
                        propName: 'smaller',
                        type: `<code>{2xl: boolean, xl: boolean, lg: boolean, md: boolean, sm: boolean, xs: boolean}</code>`,
                        default: `-`,
                        desc: 'نقاط شکست با بیانیه‌ای که کوچکتر از عرض فعلی پنجره است',
                    },
                    {
                        propName: 'windowWidth',
                        type: `<code>number</code>`,
                        default: `-`,
                        desc: 'عرض فعلی پنجره',
                    },
                ],
            },
        ]}
    />
)

const UseResponsiveDoc = () => {
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

export default UseResponsiveDoc
