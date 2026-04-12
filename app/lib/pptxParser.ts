import JSZip from 'jszip';
import { SlideContent } from '@/app/types';

export async function extractTextFromPPTX(file: File): Promise<SlideContent[]> {
    try {
        const zip = await JSZip.loadAsync(file);
        const slides: SlideContent[] = [];
        
        // Find all slide files
        const slideFiles = Object.keys(zip.files).filter(name => 
            name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
        );
        
        // Sort them correctly (slide1.xml, slide2.xml, ..., slide10.xml)
        slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
            const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
            return numA - numB;
        });

        for (let index = 0; index < slideFiles.length; index++) {
            const fileName = slideFiles[index];
            const content = await zip.file(fileName)?.async('string');
            if (!content) continue;
            
            // Extract text paragraph by paragraph to preserve formatting and new lines
            const pRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g;
            let pMatch;
            const paragraphs: string[] = [];
            
            while ((pMatch = pRegex.exec(content)) !== null) {
                const pContent = pMatch[1];
                const textRegex = /<[a-zA-Z0-9]+:t\b[^>]*>(.*?)<\/[a-zA-Z0-9]+:t>/g;
                let tMatch;
                const pTextParts: string[] = [];
                
                while ((tMatch = textRegex.exec(pContent)) !== null) {
                    // remove basic XML entities
                    let text = tMatch[1]
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&apos;/g, "'");
                    pTextParts.push(text);
                }
                
                // Runs within the same paragraph are typically adjacent text segments.
                // We join them without spaces because PowerPoint breaks words across runs for formatting.
                const joinedParagraph = pTextParts.join('').trim();
                
                if (joinedParagraph.length > 0) {
                    paragraphs.push(joinedParagraph);
                }
            }
            
            let slideText = paragraphs.join('\n\n').trim();
            
            // --- Extract connected graphs/charts and diagrams texts ---
            try {
                const baseName = fileName.split('/').pop();
                if (baseName) {
                    const relsFileName = `ppt/slides/_rels/${baseName}.rels`;
                    const relsContent = await zip.file(relsFileName)?.async('string');
                    
                    if (relsContent) {
                        const relRegex = /<Relationship[^>]*Target="([^"]+)"/g;
                        let relMatch;
                        const extraTexts: string[] = [];
                        
                        while ((relMatch = relRegex.exec(relsContent)) !== null) {
                            const target = relMatch[1];
                            if (target.includes('charts/chart') || target.includes('diagrams/data')) {
                                // Resolve path (usually starts with '../')
                                const zipPath = target.startsWith('../') ? `ppt/${target.substring(3)}` : `ppt/${target.replace(/^\//,'')}`;
                                const targetContent = await zip.file(zipPath)?.async('string');
                                
                                if (targetContent) {
                                    // Extract text nodes and chart values (<c:v>)
                                    const nodeRegex = /<([a-zA-Z0-9]+:t|c:v)\b[^>]*>(.*?)<\/\1>/g;
                                    let nMatch;
                                    const tParts = [];
                                    while ((nMatch = nodeRegex.exec(targetContent)) !== null) {
                                        let text = nMatch[2]
                                            .replace(/&lt;/g, '<')
                                            .replace(/&gt;/g, '>')
                                            .replace(/&amp;/g, '&')
                                            .replace(/&quot;/g, '"')
                                            .replace(/&apos;/g, "'");
                                        if (text.trim().length > 0) tParts.push(text.trim());
                                    }
                                    if (tParts.length > 0) {
                                        extraTexts.push(tParts.join(' | '));
                                    }
                                }
                            }
                        }
                        
                        if (extraTexts.length > 0) {
                            slideText += '\n\n[بيانات مستخرجة من رسم بياني أو مخطط]:\n' + extraTexts.join('\n');
                        }
                    }
                }
            } catch (err) {
                console.warn('Error extracting relationships for slide', fileName, err);
            }
            
            const titleMatch = slideText.slice(0, 50).trim().split(/\s+/).slice(0, 5).join(' '); // first few words as title
            
            if (slideText.length > 0) {
               slides.push({
                   slideNumber: index + 1,
                   title: titleMatch || `شريحة ${index + 1}`,
                   content: slideText
               });
            } else {
                slides.push({
                   slideNumber: index + 1,
                   title: `شريحة ${index + 1}`,
                   content: 'لا يوجد نص قابل للقراءة المباشرة في هذه الشريحة (قد تتكون من صور فقط).'
               });
            }
        }
        
        return slides;
    } catch (err) {
        console.error('Error parsing PPTX:', err);
        throw err;
    }
}
