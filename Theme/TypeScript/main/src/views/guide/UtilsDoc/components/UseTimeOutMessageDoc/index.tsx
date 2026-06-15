import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseTimeOutMessageDoc'

const demoHeader = {
    title: 'useTimeOutMessage',
    desc: 'useTimeOutMessage allows us to display a message that disappears after a while.',
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
                propName: 'interval',
                type: `<code>number</code>`,
                default: `<code>3000</code>`,
                desc: 'The duration the message is displayed',
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
                        propName: 'message',
                        type: `<code>string</code>`,
                        default: `-`,
                        desc: 'The message string',
                    },
                    {
                        propName: 'setMessage',
                        type: `<code>string</code>`,
                        default: `-`,
                        desc: 'Message setter',
                    },
                ],
            },
        ]}
    />
)

const UseTimeOutMessageDoc = () => {
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

export default UseTimeOutMessageDoc
