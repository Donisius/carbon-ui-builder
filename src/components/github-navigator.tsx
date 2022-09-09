import React, {
	useContext,
	useEffect,
	useState
} from 'react';
import {
	Breadcrumb,
	BreadcrumbItem,
	Button,
	Grid,
	Column,
	Row,
	ClickableTile
} from 'carbon-components-react';
import {
	Document32,
	Folder32,
	FolderDetails32,
	CopyLink16
} from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import { css } from 'emotion';
import { GithubContext } from '../context';
import { UserContext } from '../context/user-context';
import { GithubFilePreview } from './github-file-preview';

const folderItemStyle = css`
	min-width: 10rem;
	height: 6rem;
	margin-top: 2rem;
`;

const FolderItem = ({ repo, item, basePath }: any) => {
	const navigate = useNavigate();

	if (!item) {
		return <ClickableTile
		className={folderItemStyle}
		light={true}
		onClick={() => navigate(`${basePath}/${repo.name}`)}>
			<div><FolderDetails32 /></div>
			{repo.name}
		</ClickableTile>;
	}

	return <ClickableTile
	className={folderItemStyle}
	light={true}
	onClick={() => navigate(`${basePath}/${repo.name}/${item.path}`)}>
		<div>
			{
				item.type === 'dir' && <Folder32 />
			}
			{
				item.type === 'file' && <Document32 />
			}
		</div>
		{item.name}
	</ClickableTile>;
};

const toolbarStyle = css`
	display: flex;
	padding-left: 2rem;
	padding-right: 2rem;
	margin-top: 1rem;
	box-shadow: inset 0px -1px #d8d8d8;
`;

const breadcrumbStyle = css`
	padding-top: 1rem;
	padding-bottom: 1rem;
`;

const folderContentStyleWithToolbar = css`
	background-color: #f4f4f4;
	min-height: calc(100% - 3rem);
`;

const folderContentStyle = css`
	background-color: #f4f4f4;
	min-height: 100%;
`;

const cleanFolderState = {
	fragmentState: null as any,
	folderContent: [] as any[],
	fileContent: '',
	fileContentBase64: ''
} as any;

const findNth = (heystack: string, needle: string, n: number) => {
	// finds the index of n-th occurance of needle in heystack
	let position = -1;

	for (let i = 0; i < n; i++) {
		const pos = heystack.indexOf(needle, position + 1);

		if (pos < 0) {
			position = heystack.length;
			break;
		}
		position = pos;
	}

	return position;
};

export const GithubNavigator = ({ basePath, path, repoName, repoOrg, showToolbar=true }: any) => {
	const navigate = useNavigate();
	const { getContent, getRepos } = useContext(GithubContext);
	const { githubLogin } = useContext(UserContext);
	const [state, setState] = useState({
		...cleanFolderState,
		repos: [] as any[]
	});

	useEffect(() => {
		if (!githubLogin) {
			return;
		}
		(async () => {
			const repos = await getRepos(repoOrg);
			if (repoName) {
				const content = await getContent(repoOrg || githubLogin, repoName, path || '');

				setState({
					...cleanFolderState,
					...content,
					repos
				});
			} else {
				// no repo requested so we offer all repos to pick from
				setState({
					...cleanFolderState,
					repos
				});
			}
		})();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [repoName, path, githubLogin]);

	const compareItems = (a: any, b: any) => {
		if (a.type === 'dir' && b.type === 'file') {
			return -1;
		}
		if (a.type === 'file' && b.type === 'dir') {
			return 1;
		}
		return a.name - b.name;
	};

	return <>
		{
			showToolbar
			&& <div className={toolbarStyle}>
				<Breadcrumb className={breadcrumbStyle} noTrailingSlash>
					<BreadcrumbItem
					href={basePath}
					isCurrentPage={!repoName}
					onClick={(event: any) => {
						event.nativeEvent.preventDefault();
						navigate(basePath);
					}}>
						repo
					</BreadcrumbItem>
					{
						repoName
						&& <BreadcrumbItem
						href={`${basePath}/${repoName}`}
						isCurrentPage={!path}
						onClick={(event: any) => {
							event.nativeEvent.preventDefault();
							navigate(`${basePath}/${repoName}`);
						}}>
							{repoName}
						</BreadcrumbItem>
					}
					{
						path && path.split('/').map((item: string, index: number) => <BreadcrumbItem
						key={index}
						href={`${basePath}/${repoName}/${path.substring(0, findNth(path, '/', index + 1))}`}
						isCurrentPage={index === path.split('/').length - 1}
						onClick={(event: any) => {
							event.nativeEvent.preventDefault();
							navigate(`${basePath}/${repoName}/${path.substring(0, findNth(path, '/', index + 1))}`);
						}}>
							{item}
						</BreadcrumbItem>)
					}
				</Breadcrumb>
				<Button
					kind='ghost'
					hasIconOnly
					iconDescription='Copy sharable link'
					renderIcon={CopyLink16}
					tooltipPosition='bottom'
					tooltipAlignment='start'
					onClick={() => {
						navigator.clipboard.writeText(`${window.location.origin}/launch/${githubLogin}/${repoName}/${path}`);
					}} />
			</div>
		}
		{
			(state.fragmentState || state.fileContent)
				? <div>
					<GithubFilePreview
						editorHeight='calc(100vh - 3rem)'
						fragmentState={state.fragmentState}
						fileContent={state.fileContent}
						fileContentBase64={state.fileContentBase64}
						path={path} />
				</div>
				: <div className={showToolbar ? folderContentStyleWithToolbar : folderContentStyle}>
					<Grid>
						<Row>
							{
								repoName
								? state.folderContent.sort(compareItems).map((item: any) => <Column key={item.name}>
									<FolderItem
										basePath={`${basePath}${repoOrg ? `/${repoOrg}` : ''}`}
										repo={state.repos[state.repos.findIndex((repo: any) => repo.name === repoName)]}
										item={item} />
								</Column>)
								: state.repos.sort(compareItems).map((repo: any) => <Column key={repo.name}>
									<FolderItem repo={repo} basePath={`${basePath}${repoOrg ? `/${repoOrg}` : ''}`} />
								</Column>)
							}
						</Row>
					</Grid>
				</div>
		}
	</>;
};