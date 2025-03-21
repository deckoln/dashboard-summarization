import { Looker40SDK } from "@looker/sdk";
import { DashboardMetadata } from "../types";
import { UtilsHelper } from "./Helper";

const VERTEX_BIGQUERY_LOOKER_CONNECTION_NAME =
    process.env.VERTEX_BIGQUERY_LOOKER_CONNECTION_NAME || ''
  const VERTEX_BIGQUERY_MODEL_ID = process.env.VERTEX_BIGQUERY_MODEL_ID || ''


const generateSQL = (
  model_id: string,
  query: any,
  description: string | undefined,
  nextStepsInstructions: string
) => {
  const context = `
    Summary style/specialized instructions: ${ nextStepsInstructions || ''}
    Dashboard Detail: ${description || ''} \n
    Query Details:  "Query Title: ${query.title} \n ${query.note_text !== '' || query.note_text !== null ? "Query Note: " + query.note_text : ''} \n Query Fields: ${query.queryBody.fields} \n Query Data: ${JSON.stringify(query.queryData)} \n"
    `;
    const queryPrompt = `
    You are a specialized answering assistant that can summarize a Looker dashboard and the underlying data and propose operational next steps drawing conclusions from the Query Details listed above.
    
    You always answer with markdown formatting. You will be penalized if you do not answer with markdown when it would be possible.
    The markdown formatting you support: headings, bold, italic, links, tables, lists, code blocks, and blockquotes.
    You do not support images and never include images. You will be penalized if you render images. You will always format numerical values as either percentages or in dollar amounts rounded to the nearest cent. You should not indent any response.
    
    Your response for each dashboard query should always start on a new line in markdown, should not be indented and should include the following attributes starting with: 
    - \"Query Name\": is a markdown heading and should use the Query Title data from the "context." The query name itself should be on a newline and should not be indented.
    - \"Description\": should start on a newline, should not be indented and the generated description should be a paragraph starting on a newline. It should be 2-4 sentences max describing the query itself and should be as descriptive as possible.
    - \"Summary\": should be a blockquote, should not be indented and should be 3-5 sentences max summarizing the results of the query being as knowledgeable as possible with the goal to give the user as much information as needed so that they don't have to investigate the dashboard themselves. End with a newline,
    - \"Next Steps\" section which should contain 2-3 bullet points, that are not indented, drawing conclusions from the data and recommending next steps that should be clearly actionable followed by a newline 
    Each dashboard query summary should start on a newline, should not be indented, and should end with a divider. Below are details on the dashboard and queries. \n
    
    '''
    Context: ${context}
    '''

    Additionally here is an example of a formatted response in Markdown that you should follow, please use this as an example of how to structure your response and not verbatim copy the example text into your responses. \n
    
    ## Web Traffic Over Time \n
    This query details the amount of web traffic received to the website over the past 6 months. It includes a web traffic source field of organic, search and display
    as well as an amount field detailing the amount of people coming from those sources to the website. \n
    
    ## Summary \n
    > It looks like search historically has been driving the most user traffic with 9875 users over the past month with peak traffic happening in december at 1000 unique users.
    Organic comes in second and display a distant 3rd. It seems that display got off to a decent start in the year, but has decreased in volume consistently into the end of the year.
    There appears to be a large spike in organic traffic during the month of March a 23% increase from the rest of the year.
    \n
    
    ## Next Steps
    * Look into the data for the month of March to determine if there was an issue in reporting and/or what sort of local events could have caused the spike
    * Continue investing into search advertisement with common digital marketing strategies. IT would also be good to identify/breakdown this number by campaign source and see what strategies have been working well for Search.
    * Display seems to be dropping off and variable. Use only during select months and optimize for heavily trafficed areas with a good demographic for the site retention.\n
    \n
    `;
    
    const escapedPrompt = UtilsHelper.escapeQueryAll(queryPrompt)
    const subselect = `SELECT '` + escapedPrompt + `' AS prompt`

      
    const  max_output_tokens = 2500;
    const  temperature = 0.4;
    const  top_p = 0.98;
    const  flatten_json_output = true;
    const  top_k = 1;
  

    return `
      SELECT ml_generate_text_llm_result AS generated_content
      FROM
      ML.GENERATE_TEXT(
          MODEL \`${model_id}\`,
          (
            ${subselect}
          ),
          STRUCT(
            ${temperature} AS temperature,
            ${max_output_tokens} AS max_output_tokens,
            ${top_p} AS top_p,
            ${flatten_json_output} AS flatten_json_output,
            ${top_k} AS top_k)
        )
    `
};

export const fetchQuerySummary = async (
  queryResult: any,
  restfulService: string,
  extensionSDK: any,
  dashboardMetadata: DashboardMetadata,
  nextStepsInstructions: string,
  core40SDK: Looker40SDK
): Promise<any> => {
  try {
    const createSQLQuery = await core40SDK.ok(
      core40SDK.create_sql_query({
        connection_name: VERTEX_BIGQUERY_LOOKER_CONNECTION_NAME,
        sql: generateSQL(
          VERTEX_BIGQUERY_MODEL_ID,
          queryResult,
          dashboardMetadata.description,
          nextStepsInstructions
        ),
      })
    );

    if (createSQLQuery.slug) {
      const runSQLQuery: any = await core40SDK.ok(
        core40SDK.run_sql_query(createSQLQuery.slug, "json")
      );
      const exploreData = await runSQLQuery[0]["generated_content"];
      // clean up the data by removing backticks
      const cleanExploreData = exploreData
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return cleanExploreData;
    }
  } catch (error) {
    console.error("Error generating query summary:", error);
    return null;
  }
};
