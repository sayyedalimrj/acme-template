import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseLayoutDoc'

const demoHeader = {
    title: 'useLayout',
    desc: 'هوک useLayout دسترسی به زمینه چیدمان را فراهم می‌کند، که داده‌ها و روش‌های مختلف چیدمان برای بازسازی مجدد کانتینر صفحه را ارائه می‌دهد، که به‌طور خاص برای چیدمان الگو طراحی شده است.',
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
                        propName: 'type',
                        type: `<code>LayoutType</code>`,
                        default: '-',
                        desc: 'نوع چیدمان فعلی را نشان می‌دهد، که ممکن است بر نحوه نمایش کامپوننت‌ها تأثیر بگذارد.',
                    },
                    {
                        propName: 'adaptiveCardActive',
                        type: `<code>boolean | undefined</code>`,
                        default: '-',
                        desc: 'نشان‌دهنده این است که آیا چیدمان کارت تطبیقی فعال است یا خیر.',
                    },
                    {
                        propName: 'pageContainerReassemble',
                        type: `<code>(props: PageContainerReassembleProps) => ReactNode | undefined</code>`,
                        default: '-',
                        desc: 'تابع اختیاری برای بازسازی دینامیک ساختار کانتینر صفحه با ویژگی‌ها و کامپوننت‌های سفارشی.',
                    },
                ],
            },
        ]}
    />
)

const UseLayoutDoc = () => {
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

export default UseLayoutDoc
