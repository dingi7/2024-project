import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    const [selectedRepo, setSelectedRepo] = useState<string>("");

    const handleRepoChange = (value: string) => {
        setSelectedRepo(value);
    };

    return (
        <div className="space-y-4">
            <Select onValueChange={handleRepoChange} value={selectedRepo}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a repository" />
                </SelectTrigger>
                <SelectContent>
                    {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.name}>
                            {repo.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
