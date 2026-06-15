import { useParams } from 'react-router'

const OrderDetailHeader = () => {
    const { id } = useParams()

    return <h3>سفارش: #{id}</h3>
}

export default OrderDetailHeader
