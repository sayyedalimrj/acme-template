import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'
// Demo
import Example from './Example'

const mdPath = 'UseDirectionDoc/'

const demoHeader = {
    title: 'useDirection',
    desc: 'این هوک به مدیریت وضعیت جهت برنامه کمک می‌کند.',
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
                        propName: 'direction',
                        type: `<code>'ltr'</code> | <code>'rtl'</code>`,
                        default: `-`,
                        desc: 'وضعیت فعلی جهت',
                    },
                    {
                        propName: 'updateDirection',
                        type: `<code>(direction: 'ltr' | 'rtl') => void</code>`,
                        default: `-`,
                        desc: 'تنظیم‌کننده جهت',
                    },
                ],
            },
        ]}
    />
)

const UseDirectionDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            mdPrefixPath="docs/SharedComponentsDoc/components"
            extra={extra}
            keyText="پارامتر"
        />
    )
}

export default UseDirectionDoc
