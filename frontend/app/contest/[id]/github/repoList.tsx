import { useEffect, useState } from "react";



export default function GithubRepos({accessToken}: {accessToken: string}) {
    const [repos, setRepos] = useState<any[]>([]);

    useEffect(() => {
        fetchRepos();
    }, [accessToken]);

    const fetchRepos = async () => {
        const response = await fetch('https://api.github.com/user/repos', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        setRepos(data);
        console.log(data);
    };

    return RepoList({ repos });
}

function RepoList({ repos }: { repos: any[] }) {
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
	return (
		<div>
			<h1>Repos</h1>
			<ul>
				{repos.map((repo) => (
					<li key={repo.id} onClick={() => setSelectedRepo(repo)}>
						{repo.name}
					</li>
				))}
			</ul>
		</div>
	);
}
