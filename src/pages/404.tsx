import * as React from "react"
import { Link, HeadFC, PageProps } from "gatsby"

const NotFoundPage: React.FC<PageProps> = () => {
  return (
    <main className="w-full h-[100svh] flex flex-col select-none">
      <div className="h-16 px-4 bg-red-50 flex flex-col items-center justify-center">
        <h1 className="text-center leading-8 text-3xl text-red-400">
          <b>404 Not Found</b>
        </h1>
        <p className="leading-4"><small>&copy; isirmt</small></p>
      </div>
      <div className="h-[calc(100svh_-_16rem)] flex flex-col justify-center items-center gap-y-3 relative w-full">
        <p>お探しのページは見つかりませんでした。</p>
        <Link to="/" className="text-blue-700 underline">トップページへ</Link>
      </div>
      <div className="h-48 px-4 bg-red-50 flex flex-col items-center justify-center"></div>
    </main>
  )
}

export default NotFoundPage

export const Head: HeadFC = () => <title>Not found</title>
