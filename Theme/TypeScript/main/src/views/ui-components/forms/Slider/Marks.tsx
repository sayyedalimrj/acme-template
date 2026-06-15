import Slider from '@/components/ui/Slider'

const Marks = () => {
    return (
        <div className="my-5">
            <Slider
                defaultValue={40}
                marks={[
                    { value: 20, label: '۲۰,۰۰۰ تومان' },
                    { value: 50, label: '۵۰,۰۰۰ تومان' },
                    { value: 80, label: '۸۰,۰۰۰ تومان' },
                ]}
            />
        </div>
    )
}

export default Marks
