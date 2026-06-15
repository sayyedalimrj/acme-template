import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseScrollTopDoc'

const demoHeader = {
    title: 'useScrollTop',
    desc: 'این هوک موقعیت اسکرول پنجره را پیگیری می‌کند و یک مقدار بولی را برمی‌گرداند که نشان می‌دهد آیا کاربر از بالای صفحه اسکرول کرده است یا خیر.',
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
                        propName: 'isSticky',
                        type: `<code>boolean</code>`,
                        default: '',
                        desc: 'نشان می‌دهد که آیا صفحه از بالا اسکرول شده است (یعنی آیا عنصر باید چسبنده باشد).',
                    },
                ],
            },
        ]}
    />
)

const UseScrollTopDoc = () => {
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

export default UseScrollTopDoc
