import Container from '@/components/shared/Container'
import SpaceSignBoard from '@/assets/svg/SpaceSignBoard'

const AccessDenied = () => {
    return (
        <Container className="h-full">
            <div className="h-full flex flex-col items-center justify-center">
                <SpaceSignBoard height={280} width={280} />
                <div className="mt-10 text-center">
                    <h3 className="mb-2">دسترسی ممنوع!</h3>
                    <p className="text-base">
                        شما اجازه ورود به این صفحه را ندارید
                    </p>
                </div>
            </div>
        </Container>
    )
}

export default AccessDenied
