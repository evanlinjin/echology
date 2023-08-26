import Nav from "@app/Nav";

const Layout = ({ children }) => {
  return (
    <>
      <div className="h-full w-full flex flex-col">
        <Nav />
        {children}
      </div>
    </>
  );
};
export default Layout;
