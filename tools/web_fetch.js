export const webFetchTool = {
	name: 'webFetch',
	displayName: 'Web Fetch',
	type: 'webFetch',
	description: `Fetch and extract readable content from any web page.

Use when:
- User provides a URL to read/extract content
- You need to read content from any website

Parameters:
- url: The URL to fetch (required)
- format: Output format - "text", "html", or "markdown" (default: "text")
- maxChars: Maximum characters to return (default: 50000)`,

	async execute({ url, format = 'text', maxChars = 50000 }) {
		try {
			const response = await fetch(url, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
				},
			});

			if (!response.ok) {
				return {
					success: false,
					url,
					error: `HTTP ${response.status}: ${response.statusText}`,
				};
			}

			const html = await response.text();
			const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
			const title = titleMatch ? titleMatch[1].trim() : '';

			let content = html;
			const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
			if (bodyMatch) {
				content = bodyMatch[1];
			}

			content = content
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
				.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
				.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
				.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
				.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

			let output = content;

			if (format === 'html') {
				output = content;
			} else if (format === 'markdown') {
				output = content
					.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, '# $1\n')
					.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n')
					.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n')
					.replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1\n')
					.replace(/<br\s*\/?>/gi, '\n')
					.replace(/<[^>]+>/g, '')
					.replace(/&nbsp;/g, ' ')
					.replace(/&amp;/g, '&')
					.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/\n{3,}/g, '\n\n')
					.trim();
			} else {
				output = content
					.replace(/<[^>]+>/g, ' ')
					.replace(/&nbsp;/g, ' ')
					.replace(/&amp;/g, '&')
					.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/\s+/g, ' ')
					.trim();
			}

			if (!output || output.length < 50) {
				return {
					success: false,
					url,
					title,
					error: 'Page appears to require JavaScript to render content.',
				};
			}

			return {
				success: true,
				url,
				title,
				format,
				content: output.slice(0, maxChars),
			};
		} catch (error) {
			return {
				success: false,
				url,
				error: error.message,
			};
		}
	},
};