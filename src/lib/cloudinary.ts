/**



 * Utilidades para trabajar con URLs de Cloudinary



 */







import { determinarTipoDesdeURL } from './fileUtils';







/**



 * Optimiza una URL de imagen de Cloudinary agregando transformaciones



 * @param url - URL original de Cloudinary



 * @param options - Opciones de transformación



 */



export function optimizeCloudinaryImage(



  url: string,



  options: {



    width?: number;



    height?: number;



    quality?: 'auto' | number;



    format?: 'auto' | 'jpg' | 'png' | 'webp';



    crop?: 'fill' | 'fit' | 'limit' | 'scale';



  } = {}



): string {



  if (!url || !url.includes('cloudinary.com')) {



    return url;



  }







  const {



    width = 800,



    height,



    quality = 'auto',



    format = 'auto',



    crop = 'limit'



  } = options;







  // Dividir URL en partes



  const parts = url.split('/upload/');



  if (parts.length !== 2) {



    return url;



  }







  // Construir transformaciones



  const transformations = [



    `c_${crop}`,



    `w_${width}`,



    height ? `h_${height}` : null,



    `q_${quality}`,



    `f_${format}`



  ]



    .filter(Boolean)



    .join(',');







  // Reconstruir URL con transformaciones



  return `${parts[0]}/upload/${transformations}/${parts[1]}`;



}







/**



 * Optimiza una URL de video de Cloudinary



 */



export function optimizeCloudinaryVideo(



  url: string,



  options: {



    quality?: 'auto' | 'low' | 'medium' | 'high';



  } = {}



): string {



  if (!url || !url.includes('cloudinary.com')) {



    return url;



  }







  const { quality = 'auto' } = options;







  const parts = url.split('/upload/');



  if (parts.length !== 2) {



    return url;



  }







  const transformations = `q_${quality}`;



  return `${parts[0]}/upload/${transformations}/${parts[1]}`;



}







/**



 * Genera una thumbnail de un PDF de Cloudinary



 */



export function getCloudinaryPDFThumbnail(



  url: string,



  options: {



    page?: number;



    width?: number;



    height?: number;



  } = {}



): string {



  if (!url || !url.includes('cloudinary.com')) {



    return url;



  }







  const {



    page = 1,



    width = 400,



    height = 600



  } = options;







  const parts = url.split('/upload/');



  if (parts.length !== 2) {



    return url;



  }







  // Convertir PDF a imagen para thumbnail



  // pg_ = página específica del PDF



  const transformations = `pg_${page},c_limit,w_${width},h_${height},f_jpg,q_auto`;



  return `${parts[0]}/upload/${transformations}/${parts[1]}`;



}







/**



 * Detecta si una URL es de Cloudinary



 */



export function isCloudinaryURL(url: string): boolean {



  return url?.includes('cloudinary.com') || false;



}







/**



 * Detecta el tipo de archivo desde la URL



 * Usa la lógica centralizada de fileUtils y mapea al formato esperado



 */



export function getFileTypeFromURL(url: string): 'image' | 'video' | 'pdf' | 'other' {



  if (!url) return 'other';







  const tipo = determinarTipoDesdeURL(url);



  



  // Mapear tipos de fileUtils a formato esperado



  switch (tipo) {



    case 'imagen':



      return 'image';



    case 'video':



      return 'video';



    case 'documento':



      // Verificar específicamente si es PDF



      return url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'other';



    default:



      return 'other';



  }



}







/**



 * Obtiene una URL directa de descarga para archivos de Cloudinary



 */



export function getCloudinaryDownloadURL(url: string, filename?: string): string {



  if (!url || !url.includes('cloudinary.com')) {



    return url;



  }







  const parts = url.split('/upload/');



  if (parts.length !== 2) {



    return url;



  }







  const transformations = filename 



    ? `fl_attachment:${encodeURIComponent(filename)}`



    : 'fl_attachment';







  return `${parts[0]}/upload/${transformations}/${parts[1]}`;



}







/**



 * Arregla URLs de Cloudinary que pueden venir malformadas del backend



 * Asegura que tengan el formato correcto: https://res.cloudinary.com/[cloud]/[type]/upload/[public-id]



 */



export function fixCloudinaryURL(url: string): string {



  if (!url) return url;



  



  // Limpiar espacios y caracteres extraños



  url = url.trim();



  



  // Si no es URL de Cloudinary, devolverla tal cual



  if (!url.includes('cloudinary.com') && !url.includes('cloudinary')) {



    return url;



  }



  



  // Si la URL ya tiene /upload/, verificar que esté bien formada



  if (url.includes('/upload/')) {



    // Verificar que tenga el protocolo



    if (!url.startsWith('http://') && !url.startsWith('https://')) {



      url = 'https://' + url;



    }



    return url;



  }



  



  // Si falta /upload/, intentar reconstruir la URL



  // Formato esperado: https://res.cloudinary.com/CLOUD_NAME/TYPE/upload/PUBLIC_ID



  const cloudinaryMatch = url.match(/res\.cloudinary\.com\/([^\/]+)\/([^\/]+)\/(.+)/);



  if (cloudinaryMatch) {



    const [, cloudName, type, rest] = cloudinaryMatch;



    // Si rest no contiene 'upload', agregarlo



    if (!rest.includes('upload')) {



      return `https://res.cloudinary.com/${cloudName}/${type}/upload/${rest}`;



    }



  }



  



  // Si la URL tiene formato incompleto, intentar arreglarla



  // Ejemplo: res.cloudinary.com/cloud/image/v123/folder/file.jpg



  const simpleMatch = url.match(/cloudinary\.com\/([^\/]+)\/([^\/]+)\/v\d+\/(.+)/);



  if (simpleMatch) {



    const [, cloudName, type, publicId] = simpleMatch;



    return `https://res.cloudinary.com/${cloudName}/${type}/upload/${publicId}`;



  }



  



  // Si nada funciona, devolver la URL original con https



  if (!url.startsWith('http://') && !url.startsWith('https://')) {



    url = 'https://' + url;



  }



  



  return url;



}







/**



 * Arregla URLs de PDFs en Cloudinary



 * Los PDFs en Cloudinary se sirven desde /image/upload/ (NO /raw/upload/)



 */



export function fixCloudinaryPDFUrl(url: string): string {



  if (!url) return url;



  



  url = url.trim();



  



  // Si no es URL de Cloudinary, devolverla tal cual



  if (!url.includes('cloudinary.com')) {



    return url;



  }



  



  // Asegurar protocolo https



  if (!url.startsWith('http://') && !url.startsWith('https://')) {



    url = 'https://' + url;



  }



  



  // Los PDFs en Cloudinary se sirven desde /image/upload/, NO cambiar a /raw/



  // Solo asegurar que la URL esté bien formada



  return url;



}







/**



 * Genera URL de descarga para PDFs de Cloudinary



 * Usa fl_attachment para forzar descarga



 */



export function getCloudinaryPDFDownloadUrl(url: string, filename: string): string {



  if (!url || !url.includes('cloudinary.com')) return url;



  



  // Si ya tiene fl_attachment, devolverla



  if (url.includes('fl_attachment')) return url;



  



  const parts = url.split('/upload/');



  if (parts.length === 2) {



    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');



    return `${parts[0]}/upload/fl_attachment:${cleanFilename}/${parts[1]}`;



  }



  



  return url;



}







/**



 * Rota una imagen de Cloudinary usando transformaciones de URL



 * @param url - URL original de Cloudinary



 * @param angle - Ángulo de rotación (90, 180, 270)



 * @returns URL con la transformación de rotación aplicada



 */



export function rotateCloudinaryImage(url: string, angle: number): string {



  if (!url || !url.includes('cloudinary.com')) return url;







  const validAngles = [90, 180, 270];



  if (!validAngles.includes(angle)) return url;







  const parts = url.split('/upload/');



  if (parts.length !== 2) return url;







  return `${parts[0]}/upload/a_${angle}/${parts[1]}`;



}







/**



 * Rota una imagen usando Canvas y la sube como nuevo archivo a Cloudinary



 * @param imageUrl - URL original de la imagen



 * @param angle - Ángulo de rotación (90, 180, 270)



 * @param filename - Nombre del archivo original



 * @returns Promise con el nuevo archivo subido



 */



export async function rotateAndUploadImage(



  imageUrl: string, 



  angle: number, 



  filename: string



): Promise<File> {



  return new Promise((resolve, reject) => {



    const img = new Image();



    img.crossOrigin = 'anonymous';



    



    img.onload = () => {



      try {



        const canvas = document.createElement('canvas');



        const ctx = canvas.getContext('2d');



        



        if (!ctx) {



          reject(new Error('No se pudo obtener el contexto del canvas'));



          return;



        }







        // Calcular nuevas dimensiones según el ángulo



        let newWidth = img.width;



        let newHeight = img.height;



        



        if (angle === 90 || angle === 270) {



          newWidth = img.height;



          newHeight = img.width;



        }







        canvas.width = newWidth;



        canvas.height = newHeight;







        // Aplicar rotación



        ctx.save();



        



        if (angle === 90) {



          ctx.translate(newWidth / 2, newHeight / 2);



          ctx.rotate(Math.PI / 2);



          ctx.drawImage(img, -img.width / 2, -img.height / 2);



        } else if (angle === 180) {



          ctx.translate(newWidth / 2, newHeight / 2);



          ctx.rotate(Math.PI);



          ctx.drawImage(img, -img.width / 2, -img.height / 2);



        } else if (angle === 270) {



          ctx.translate(newWidth / 2, newHeight / 2);



          ctx.rotate(-Math.PI / 2);



          ctx.drawImage(img, -img.width / 2, -img.height / 2);



        }



        



        ctx.restore();







        // Convertir canvas a Blob y luego a File



        canvas.toBlob((blob) => {



          if (!blob) {



            reject(new Error('No se pudo convertir el canvas a blob'));



            return;



          }







          // Generar nuevo nombre de archivo



          const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');



          const extension = filename.split('.').pop() || 'jpg';



          const newFilename = `${nameWithoutExt}_rotated_${angle}.${extension}`;



          



          const file = new File([blob], newFilename, { type: blob.type });



          resolve(file);



        }, 'image/jpeg', 0.95); // 95% quality



        



      } catch (error) {



        reject(error);



      }



    };







    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));



    img.src = imageUrl;



  });



}



