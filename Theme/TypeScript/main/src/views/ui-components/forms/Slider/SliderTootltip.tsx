import Slider from '@/components/ui/Slider'

const SliderTootltip = () => {
    return (
        <div className="flex flex-col gap-y-6">
            <div className="my-5 flex flex-col">
                <strong className="mb-2 text-gray-900 dark:text-white">
                    نمایش تولتیپ هنگام هاور
                </strong>
                <Slider showTooltipOnHover defaultValue={60} />
            </div>
            <div className="my-5 flex flex-col">
                <strong className="mb-2 text-gray-900 dark:text-white">
                    همیشه نمایش تولتیپ
                </strong>
                <Slider alwaysShowTooltip defaultValue={60} />
            </div>
            <div className="my-5 flex flex-col">
                <strong className="mb-2 text-gray-900 dark:text-white">
                    تولتیپ سفارشی
                </strong>
                <Slider
                    showTooltipOnHover
                    tooltip={(value) => `${value}%`}
                    defaultValue={60}
                />
            </div>
        </div>
    )
}

export default SliderTootltip
