interface ILayoutPageProps {
  children: React.ReactNode
}

const LayoutPage = ({ children }: ILayoutPageProps): JSX.Element => {
  return <main className="flex-1">{children}</main>
}

export default LayoutPage
