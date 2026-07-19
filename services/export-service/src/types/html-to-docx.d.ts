declare module 'html-to-docx' {
  function htmlDocx(html: string): Promise<Buffer>;
  export = htmlDocx;
}
