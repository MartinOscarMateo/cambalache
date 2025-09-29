// frontend/src/pages/Home.jsx
import { Link } from "react-router-dom";


export default function Home() {
  const samples = [
    {
      id: "001",
      title: "Lorem ipsum dolor sit amet",
      excerpt:
        "Consectetur adipiscing elit. Integer feugiat nunc at tincidunt efficitur.",
    },
    {
      id: "002",
      title: "Sed do eiusmod tempor",
      excerpt:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.",
    },
    {
      id: "003",
      title: "Duis autem vel eum",
      excerpt:
        "Iriure dolor in hendrerit in vulputate velit esse molestie consequat.",
    },
  ];

  return (
    <main className="mt-0 w-[85%] mx-auto border-l border-r border-[#646cff]">
      <div className="h-[45vh] border-b border-[#646cff] text-left">
        <div className="pb-[40px] flex items-end h-full w-[30%] ms-[50px]">
          <div className="flex flex-col items-start gap-4">
            <h1 className="text-xs">Imagen Aca.</h1>
            <Link to={``} className="border py-2 px-4 rounded-full hover:bg-[#646cff] hover:text-[#ffffff]!">Ver</Link>
          </div>
        </div>
      </div>
      <h1 className="my-[40px]">Lorem Ipsum Dolor</h1>
      <section className="flex justify-center gap-4 my-[40px] border-b border-[#646cff] pb-[40px]">
        <div className="w-[250px] border border-[#646cff] rounded-sm">
          <div className="flex flex-col items-center py-4">
            <div className="border rounded-full w-[50px] h-[50px] my-4"></div>
            <h2>Lorem Ipsum</h2>
          </div>
          <div className="flex items-center bg-[#2f2f2f] rounded-b-sm">
            <p className="w-[80%] py-4 mx-auto">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque
              esse error mollitia similique saepe nisi possimus fugiat rem
              minus!
            </p>
          </div>
        </div>
        <div className="w-[250px] border border-[#646cff] rounded-sm">
          <div className="flex flex-col items-center py-4">
            <div className="border rounded-full w-[50px] h-[50px] my-4"></div>
            <h2>Lorem Ipsum</h2>
          </div>
          <div className="flex items-center bg-[#2f2f2f] rounded-b-sm">
            <p className="w-[80%] py-4 mx-auto">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque
              esse error mollitia similique saepe nisi possimus fugiat rem
              minus!
            </p>
          </div>
        </div>
        <div className="w-[250px] border border-[#646cff] rounded-sm">
          <div className="flex flex-col items-center py-4">
            <div className="border rounded-full w-[50px] h-[50px] my-4"></div>
            <h2>Lorem Ipsum</h2>
          </div>
          <div className="flex items-center bg-[#2f2f2f] rounded-b-sm">
            <p className="w-[80%] py-4 mx-auto">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque
              esse error mollitia similique saepe nisi possimus fugiat rem
              minus!
            </p>
          </div>
        </div>
        <div className="w-[250px] border border-[#646cff] rounded-sm">
          <div className="flex flex-col items-center py-4">
            <div className="border rounded-full w-[50px] h-[50px] my-4"></div>
            <h2>Lorem Ipsum</h2>
          </div>
          <div className="flex items-center bg-[#2f2f2f] rounded-b-sm">
            <p className="w-[80%] py-4 mx-auto">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque
              esse error mollitia similique saepe nisi possimus fugiat rem
              minus!
            </p>
          </div>
        </div>
      </section>
      <section className="">
        <h2 className="mb-5 text-[2rem]">Publicaciones</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dictum
          lacus nisi interdum urna, non varius mi est nec nisi. Aliquam erat
          volutpat. Curabitur maximus at porta gravida.
        </p>
        <p>
          Proin posuere facilisis urna sed consequat. Mauris porttitor augue
          at fermentum laoreet. Suspendisse potenti. Etiam vitae lorem at
          tortor ultrices tristique.
        </p>
        <div className="flex w-[70%] mx-auto gap-4 mt-5">
          {samples.map((p) => (
            <article key={p.id} className="border border-[#646cff] h-[340px]">
              <div className="w-[%100] h-[55%] border-b border-[#646cff]"></div>
              <div className="flex flex-col justify-center h-[45%] w-[90%] mx-auto text-left">
                <h2 className="text-[1.5rem]">{p.title}</h2>
                <p>{p.excerpt}</p>
                <div className="mt-3 mb-3">
                  <Link to={`/posts/${p.id}`} className="border py-2 px-3 rounded-full hover:bg-[#646cff] hover:text-[#ffffff]!">Ver</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="my-7">
          <Link to="/posts" className="border py-2 px-4 rounded-full hover:bg-[#646cff] hover:text-[#ffffff]!">
            Ver todas las publicaciones 
            
          </Link>
        </p>
      </section>
      {/* <section>
        <h2>¿Cómo funciona?</h2>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse
          cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
          cupidatat non proident.
        </p>
      </section> */}
    </main>
  );
}
