import Slider from '@/components/ui/Slider'

const marks1 = [
    { value: 0, label: '۰°سانتی‌گراد' },
    { value: 25, label: '۲۵°سانتی‌گراد' },
    { value: 50, label: '۵۰°سانتی‌گراد' },
    { value: 75, label: '۷۵°سانتی‌گراد' },
    { value: 100, label: '۱۰۰°سانتی‌گراد' },
]

const marks2 = [
    { value: 0, label: '۰°سانتی‌گراد' },
    { value: 26, label: '۲۶°سانتی‌گراد' },
    { value: 37, label: '۳۷°سانتی‌گراد' },
    { value: 100, label: '۱۰۰°سانتی‌گراد' },
]

const Step = () => {
    return (
        <div className="flex flex-col gap-10">
            <div className="my-5 mx-3">
                <Slider
                    defaultValue={marks1[1].value}
                    tooltip={(val) =>
                        marks1.find((mark) => mark.value === val)!.label
                    }
                    step={25}
                    marks={marks1}
                />
            </div>
            <div className="my-5 mx-3">
                <Slider
                    stepOnMarks
                    defaultValue={marks2[1].value}
                    tooltip={(val) =>
                        marks2.find((mark) => mark.value === val)!.label
                    }
                    marks={marks2}
                />
            </div>
        </div>
    )
}

export default Step
